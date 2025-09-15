// backend/index.js - FINAL CORRECTED VERSION
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient, Role, BatchStatus, ReportStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import archiver from 'archiver';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticateToken, authenticateTokenOptional, authorizeRole } from './middleware.js';
import { Parser } from 'json2csv';

dotenv.config();
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE SETUP ---
const allowedOrigins = ['http://localhost:5173', 'https://criterion-mark.vercel.app'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Use-Location'],
}));
app.use(express.json());
app.set('trust proxy', true);

// --- CLOUDINARY & MULTER CONFIGURATION ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
    cloudinary:cloudinary,
    params: { folder: 'criterion-mark-seals', allowed_formats: ['jpeg', 'png', 'jpg'], public_id: (req, file) => `batch-${req.params.id}-${Date.now()}` },
});
const upload = multer({ storage: storage });

// --- UTILITY FUNCTIONS ---
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const generateSixDigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateEightDigitCode = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const generateDualSealBuffer = async (qrCode, backgroundUrl) => {
    if (!backgroundUrl) {
        throw new Error('Seal background URL is missing.');
    }

    // 1. Get background
    const backgroundResponse = await axios({ method: 'get', url: backgroundUrl, responseType: 'arraybuffer' });
    const backgroundBuffer = backgroundResponse.data;
    const backgroundMeta = await sharp(backgroundBuffer).metadata();
    const canvasWidth = backgroundMeta.width;

    // 2. Define layout constants based on your feedback
    const qrSize = 80; // Using a smaller QR size to fit within the design
    const horizontalCenter = Math.floor((canvasWidth - qrSize) / 2);
    
    // These vertical positions are estimates to place elements on top of the background
    const customerLabelTop = 100; // Adjusted to be relative to top
    const customerQrTop = customerLabelTop + 25;
    const pharmacyLabelTop = customerQrTop + qrSize + 15;
    const pharmacyQrTop = pharmacyLabelTop + 45;

    // 3. Generate QR code buffers
    const customerQrBuffer = await qrcode.toBuffer(qrCode.code, { width: qrSize, margin: 1, errorCorrectionLevel: 'H', type: 'png' });
    const pharmacyQrBuffer = await qrcode.toBuffer(qrCode.outerCode, { width: qrSize, margin: 1, errorCorrectionLevel: 'H', type: 'png' });

    // 4. Generate label buffers from SVG to ensure transparency
    const customerLabelSvg = Buffer.from(`<svg width="120" height="20"><text x="60" y="15" text-anchor="middle" font-family="sans-serif" font-size="12" fill="black">CUSTOMER</text></svg>`);
    const customerLabelBuffer = await sharp(customerLabelSvg).png().toBuffer();

    const pharmacyLabelSvg = Buffer.from(`
    <svg width="120" height="35">
        <text x="60" y="12" text-anchor="middle" font-family="sans-serif" font-size="12" fill="black">PHARMACY</text>
        <line x1="10" y1="18" x2="110" y2="18" stroke="black" stroke-width="1" />
        <text x="60" y="30" text-anchor="middle" font-family="sans-serif" font-size="12" fill="black">MANUFACTURER</text>
    </svg>`);
    const pharmacyLabelBuffer = await sharp(pharmacyLabelSvg).png().toBuffer();

    // 5. Composite everything ON TOP of the original background
    const finalImageBuffer = await sharp(backgroundBuffer)
        .composite([
            { input: customerLabelBuffer, top: customerLabelTop, left: Math.floor((canvasWidth - 120) / 2) },
            { input: customerQrBuffer, top: customerQrTop, left: horizontalCenter },
            { input: pharmacyLabelBuffer, top: pharmacyLabelTop, left: Math.floor((canvasWidth - 120) / 2) },
            { input: pharmacyQrBuffer, top: pharmacyQrTop, left: horizontalCenter },
        ])
        .png()
        .toBuffer();
    
    return finalImageBuffer;
};

// --- ROUTES ---
app.get('/', (req, res) => res.json({ message: 'Welcome to the Criterion Mark API!' }));

// --- ADMIN SETTINGS ROUTES ---
app.get('/api/admin/settings', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ['universal_warning_text', 'universal_warning_video_url'] } },
    });
    const result = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});
    res.status(200).json(result);
}));

app.post('/api/admin/settings', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { universalWarningText, universalWarningVideoUrl } = req.body;

    if (universalWarningText !== undefined) {
        await prisma.systemSetting.upsert({
            where: { key: 'universal_warning_text' },
            update: { value: universalWarningText },
            create: { key: 'universal_warning_text', value: universalWarningText },
        });
    }
    if (universalWarningVideoUrl !== undefined) {
        await prisma.systemSetting.upsert({
            where: { key: 'universal_warning_video_url' },
            update: { value: universalWarningVideoUrl },
            create: { key: 'universal_warning_video_url', value: universalWarningVideoUrl },
        });
    }

    res.status(200).json({ message: 'Settings updated successfully.' });
}));

// --- PRINTING PORTAL ROUTES ---
app.get('/api/printing/pending', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const pendingBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.PENDING_PRINTING },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { admin_approved_at: 'asc' },
    });
    res.status(200).json(pendingBatches);
}));

app.get('/api/printing/in-progress', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const inProgressBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.PRINTING_IN_PROGRESS },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { print_started_at: 'asc' },
    });
    res.status(200).json(inProgressBatches);
}));

app.put('/api/printing/batches/:id/start', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const printingUserId = req.user.userId; // CAPTURE ID

    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: { 
            status: BatchStatus.PRINTING_IN_PROGRESS, 
            print_started_at: new Date(),
            printingStartedById: printingUserId, // SAVE ID
        },
    });
    res.status(200).json(updatedBatch);
}));

app.put('/api/printing/batches/:id/complete', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const printingUserId = req.user.userId; // CAPTURE ID

    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: { 
            status: BatchStatus.PRINTING_COMPLETE, 
            print_completed_at: new Date(),
            printingCompletedById: printingUserId, // SAVE ID
        },
    });
    res.status(200).json(updatedBatch);
}));

app.get('/api/printing/history', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const completedBatches = await prisma.batch.findMany({
        where: {
            status: {
                in: [
                    BatchStatus.PRINTING_COMPLETE,
                    BatchStatus.IN_TRANSIT,
                    BatchStatus.PENDING_MANUFACTURER_CONFIRMATION,
                    BatchStatus.DELIVERED_TO_MANUFACTURER
                ]
            }
        },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { id: 'desc' },
    });
    res.status(200).json(completedBatches);
}));

app.get('/api/printing/batches/:id', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const batchDetails = await prisma.batch.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            manufacturer: { select: { companyName: true } },
            qrCodes: { orderBy: { id: 'asc' } },
        },
    });
    if (!batchDetails) {
        return res.status(404).json({ error: 'Batch not found.' });
    }
    res.status(200).json(batchDetails);
}));

app.get('/api/printing/seal/:code', authenticateToken, authorizeRole([Role.ADMIN, Role.PRINTING]), asyncHandler(async (req, res) => {
    const { code } = req.params;
    const qrCode = await prisma.qRCode.findUnique({
        where: { code },
        include: { batch: { select: { seal_background_url: true } } },
    });
    if (!qrCode) {
        return res.status(404).json({ error: 'QR Code not found.' });
    }
    if (!qrCode.batch.seal_background_url) {
        return res.status(400).json({ error: 'No seal background has been assigned to this batch by an admin.' });
    }
    
    const finalImageBuffer = await generateDualSealBuffer(qrCode, qrCode.batch.seal_background_url);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="seal_${qrCode.code}.png"`);
    res.status(200).send(finalImageBuffer);
    
}));

app.post('/api/printing/batch/:id/zip', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
        where: { id: parseInt(id, 10) },
        include: { qrCodes: true },
    });
    if (!batch || !batch.seal_background_url) {
        return res.status(404).json({ error: 'Batch or seal background not found.' });
    }
        res.attachment(`batch_${id}_seals.zip`);
    const archive = archiver('zip');
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    // Filter out master codes, as they are not individual seals
    const childQrs = batch.qrCodes.filter(qr => !qr.isMaster);

    for (const qr of childQrs) {
        try {
            const finalImageBuffer = await generateDualSealBuffer(qr, batch.seal_background_url);
            archive.append(finalImageBuffer, { name: `seal_${qr.code}.png` });
        } catch (error) {
            console.error(`Failed to generate seal for QR code ${qr.code}:`, error.message);
            // Optionally, append an error placeholder to the zip
            archive.append(`Error generating seal for ${qr.code}: ${error.message}`, { name: `error_${qr.code}.txt` });
        }
    }
    await archive.finalize();
}));

// --- LOGISTICS PORTAL ROUTES ---
app.get('/api/logistics/pending-pickup', authenticateToken, authorizeRole([Role.LOGISTICS]), asyncHandler(async (req, res) => {
    const readyBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.PRINTING_COMPLETE },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { print_completed_at: 'asc' },
    });
    res.status(200).json(readyBatches);
}));

app.get('/api/logistics/in-transit', authenticateToken, authorizeRole([Role.LOGISTICS]), asyncHandler(async (req, res) => {
    const inTransitBatches = await prisma.batch.findMany({
        where: { status: { in: [BatchStatus.IN_TRANSIT, BatchStatus.PENDING_MANUFACTURER_CONFIRMATION] } },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { picked_up_at: 'desc' },
    });
    res.status(200).json(inTransitBatches);
}));

app.put('/api/logistics/batches/:id/pickup', authenticateToken, authorizeRole([Role.LOGISTICS]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({ where: { id: parseInt(id, 10) } });
    if (!batch) return res.status(404).json({ error: 'Batch not found.' });
    if (batch.status !== BatchStatus.PRINTING_COMPLETE) {
        return res.status(400).json({ error: `Batch status is '${batch.status}', expected 'PRINTING_COMPLETE'.` });
    }
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: { status: BatchStatus.IN_TRANSIT, picked_up_at: new Date() },
    });
    res.status(200).json(updatedBatch);
}));

app.put('/api/logistics/batches/:id/deliver', authenticateToken, authorizeRole([Role.LOGISTICS]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { delivery_notes } = req.body;
    const safeDeliveryNotes = (typeof delivery_notes === 'string' && delivery_notes.trim()) || null;

    const batch = await prisma.batch.findUnique({ where: { id: parseInt(id, 10) } });
    if (!batch) {
        return res.status(404).json({ error: 'Batch not found.' });
    }
    if (batch.status !== BatchStatus.IN_TRANSIT) {
        return res.status(400).json({ error: `Batch status is '${batch.status}', expected 'IN_TRANSIT'.` });
    }
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: {
            status: BatchStatus.PENDING_MANUFACTURER_CONFIRMATION,
            delivery_notes: safeDeliveryNotes
        },
    });
    res.status(200).json(updatedBatch);
}));

app.post('/api/logistics/batches/:id/finalize', authenticateToken, authorizeRole([Role.LOGISTICS]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { confirmation_code } = req.body;

    if (!confirmation_code || typeof confirmation_code !== 'string' || confirmation_code.length !== 6) {
        return res.status(400).json({ error: 'A valid 6-digit confirmation code is required.' });
    }

    const batchId = parseInt(id, 10);
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });

    if (!batch) {
        return res.status(404).json({ error: 'Batch not found.' });
    }
    if (batch.status !== BatchStatus.PENDING_MANUFACTURER_CONFIRMATION) {
        return res.status(400).json({ error: 'This batch is not awaiting finalization.' });
    }
    if (!batch.delivery_confirmation_code) {
        return res.status(500).json({ error: 'Server error: Cannot find a confirmation code for this batch.' });
    }
    if (batch.delivery_confirmation_code !== confirmation_code.trim()) {
        return res.status(400).json({ error: 'Invalid confirmation code.' });
    }

    const updatedBatch = await prisma.batch.update({
        where: { id: batchId },
        data: {
            status: BatchStatus.DELIVERED_TO_MANUFACTURER,
            delivered_at: new Date()
        },
    });

    res.status(200).json(updatedBatch);
}));

app.get('/api/logistics/history', authenticateToken, authorizeRole([Role.LOGISTICS]), asyncHandler(async (req, res) => {
    const deliveredBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.DELIVERED_TO_MANUFACTURER },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { delivered_at: 'desc' },
    });
    res.status(200).json(deliveredBatches);
}));

// --- SKINCARE BRAND PORTAL ROUTES ---
const getSkincareBrand = async (req, res, next) => {
    const userId = req.user.userId;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: "User not found." });

        const skincareBrand = await prisma.skincareBrand.upsert({
            where: { userId: userId },
            update: {},
            create: {
                userId: userId,
                brandName: user.companyName,
                cacNumber: user.companyRegNumber,
                isVerified: true,
            }
        });

        if (!skincareBrand) return res.status(403).json({ error: 'Could not find or create a skincare brand profile.' });
        req.brand = skincareBrand;
        next();
    } catch (error) {
        next(error);
    }
};

app.get('/api/skincare/products', authenticateToken, authorizeRole([Role.SKINCARE_BRAND]), getSkincareBrand, asyncHandler(async (req, res) => {
    const products = await prisma.skincareProduct.findMany({
        where: { brandId: req.brand.id },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(products);
}));

app.post('/api/skincare/products', authenticateToken, authorizeRole([Role.SKINCARE_BRAND]), getSkincareBrand, asyncHandler(async (req, res) => {
    const { productName, ingredients, skinReactions, nafdacNumber } = req.body;
    if (!productName || !ingredients) {
        return res.status(400).json({ error: 'Product Name and Ingredients are required.' });
    }
    const newProduct = await prisma.skincareProduct.create({
        data: {
            brandId: req.brand.id,
            productName,
            ingredients,
            skinReactions,
            nafdacNumber,
            uniqueCode: nanoid(10).toUpperCase(),
        },
    });
    res.status(201).json(newProduct);
}));
// --- START: HEALTH ADVISOR PORTAL ROUTES ---

// Endpoint for a Health Advisor to create a new video entry
app.post('/api/health-advisor/videos', authenticateToken, authorizeRole([Role.HEALTH_ADVISOR, Role.ADMIN]), asyncHandler(async (req, res) => {
    try {
        const { nafdacNumber, drugName, genuineVideoUrl, counterfeitVideoUrl, genuineText, counterfeitText } = req.body;
        const uploaderId = req.user.userId;

        if (!nafdacNumber || !drugName || !genuineVideoUrl || !counterfeitVideoUrl || !genuineText || !counterfeitText) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        
        const existingVideo = await prisma.healthVideo.findUnique({
            where: { nafdacNumber: nafdacNumber.trim() }
        });

        if (existingVideo) {
            return res.status(409).json({ error: 'A video entry for this NAFDAC number already exists. Please update the existing one instead.' });
        }

        const newVideo = await prisma.healthVideo.create({
            data: {
                nafdacNumber: nafdacNumber.trim(),
                drugName,
                genuineVideoUrl,
                counterfeitVideoUrl,
                genuineText,
                counterfeitText,
                uploaderId,
            }
        });

        res.status(201).json({ message: 'Health content entry created successfully.', video: newVideo });

    } catch (error) {
        console.error('Error creating health video:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}));

// --- NEW ENDPOINT: Get a list of delivered drugs that NEED content ---
app.get('/api/health-advisor/pending-content', authenticateToken, authorizeRole([Role.HEALTH_ADVISOR, Role.ADMIN]), asyncHandler(async (req, res) => {
    try {
        // Step 1: Find all NAFDAC numbers for which content has already been created.
        const existingContentNafdacNumbers = await prisma.healthVideo.findMany({
            select: { nafdacNumber: true }
        });
        const existingNafdacSet = new Set(existingContentNafdacNumbers.map(v => v.nafdacNumber));

        // Step 2: Find all batches that have been delivered to the manufacturer.
        const deliveredBatches = await prisma.batch.findMany({
            where: {
                status: 'DELIVERED_TO_MANUFACTURER'
            },
            select: {
                drugName: true,
                nafdacNumber: true
            },
            orderBy: {
                delivered_at: 'desc'
            }
        });

        // Step 3: Filter this list to find which ones are "pending" (i.e., don't have content yet)
        const pendingContentMap = new Map();
        for (const batch of deliveredBatches) {
            if (!existingNafdacSet.has(batch.nafdacNumber) && !pendingContentMap.has(batch.nafdacNumber)) {
                pendingContentMap.set(batch.nafdacNumber, {
                    nafdacNumber: batch.nafdacNumber,
                    drugName: batch.drugName
                });
            }
        }
        
        res.status(200).json(Array.from(pendingContentMap.values()));

    } catch (error) {
        console.error('Error fetching pending content list:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}));

// Endpoint to get all videos uploaded by the logged-in Health Advisor
app.get('/api/health-advisor/videos', authenticateToken, authorizeRole([Role.HEALTH_ADVISOR, Role.ADMIN]), asyncHandler(async (req, res) => {
    try {
        const uploaderId = req.user.userId;

        const videos = await prisma.healthVideo.findMany({
            where: { uploaderId: uploaderId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(videos);

    } catch (error) {
        console.error('Error fetching health videos:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}));

// --- END: HEALTH ADVISOR PORTAL ROUTES ---

// --- START: NEW ROUTE TO GET PRODUCT DETAILS BY QR CODE ---
app.get('/api/qrcodes/details/:outerCode', authenticateToken, authorizeRole([Role.PHARMACY, Role.ADMIN]), asyncHandler(async (req, res) => {
    try {
        const { outerCode } = req.params;

        if (!outerCode) {
            return res.status(400).json({ error: 'Outer code parameter is required.' });
        }

        const qrCodeDetails = await prisma.qRCode.findUnique({
            where: { outerCode: outerCode.trim() },
            include: {
                batch: {
                    select: {
                        drugName: true,
                    }
                }
            }
        });

        if (!qrCodeDetails) {
            return res.status(404).json({ error: 'Product code not found in the system.' });
        }

        if (!qrCodeDetails.batch || !qrCodeDetails.batch.drugName) {
            return res.status(404).json({ error: 'Could not find product details associated with this code.' });
        }

        res.status(200).json({
            drugName: qrCodeDetails.batch.drugName,
            outerCode: qrCodeDetails.outerCode, // Return the code for confirmation
        });

    } catch (error) {
        console.error('Error fetching QR code details:', error);
        res.status(500).json({ error: 'An internal server error occurred while fetching product details.' });
    }
}));

// --- PHARMACY SECTION ---

app.get('/api/pharmacy/dispense-history', authenticateToken, authorizeRole([Role.PHARMACY]), asyncHandler(async (req, res) => {
    const pharmacyId = req.user.userId;
    const { startDate, endDate, search } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
        dateFilter = {
            dispensedAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };
    } else {
        // Default to today's records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        dateFilter = {
            dispensedAt: {
                gte: today,
                lt: tomorrow,
            },
        };
    }

    const whereClause = {
        pharmacyId: pharmacyId,
        ...dateFilter,
        ...(search && {
            qrCode: {
                batch: {
                    drugName: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            },
        }),
    };

    const history = await prisma.dispenseRecord.findMany({
        where: whereClause,
        orderBy: { dispensedAt: 'desc' },
        select: { // Select only necessary fields
            dispensedAt: true,
            qrCode: {
                select: {
                    batch: {
                        select: {
                            drugName: true,
                        },
                    },
                },
            },
        },
    });

    // Group by date and format
    const groupedHistory = history.reduce((acc, record) => {
        const date = new Date(record.dispensedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push({
            productName: record.qrCode.batch.drugName,
            dispensedAt: record.dispensedAt,
        });
        return acc;
    }, {});

    res.status(200).json(groupedHistory);
}));

// --- PUBLIC SKINCARE VERIFICATION ROUTE ---
app.get('/api/skincare/verify/:code', asyncHandler(async (req, res) => {
    const { code } = req.params;
    if (!code) {
        return res.status(400).json({ status: 'error', message: 'A verification code is required.' });
    }
    const product = await prisma.skincareProduct.findUnique({
        where: { uniqueCode: code.toUpperCase() },
        include: {
            brand: { select: { brandName: true, isVerified: true } }
        }
    });
    if (!product) {
        return res.status(404).json({ status: 'error', message: 'This code is invalid. The product is not registered in our system.' });
    }
    if (!product.brand.isVerified) {
        return res.status(403).json({ status: 'error', message: `This product is from '${product.brand.brandName}', which is not yet a verified brand in our system.` });
    }
    res.status(200).json({ status: 'success', message: 'Product Verified Successfully!', data: product });
}));

// --- USER-SPECIFIC ROUTES ---
app.get('/api/user/scan-history', authenticateToken, asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId;

        const scanRecords = await prisma.scanRecord.findMany({
            where: {
                scannerId: userId,
                scannedByRole: 'CUSTOMER' // Only show scans made as a customer
            },
            orderBy: {
                scannedAt: 'desc'
            },
            include: {
                qrCode: {
                    include: {
                        batch: {
                            select: {
                                drugName: true,
                                nafdacNumber: true,
                                seal_background_url: true
                            }
                        },
                        dispenseRecord: {
                            include: {
                                pharmacy: {
                                    select: {
                                        companyName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const nafdacNumbers = [...new Set(scanRecords.map(r => r.qrCode?.batch.nafdacNumber).filter(Boolean))];
        
        const healthVideos = await prisma.healthVideo.findMany({
            where: {
                nafdacNumber: { in: nafdacNumbers }
            }
        });

        const healthContentMap = new Map(healthVideos.map(v => [v.nafdacNumber, v]));

        const history = scanRecords.map(record => {
            const qr = record.qrCode;
            const batch = qr?.batch;
            const healthContent = batch ? healthContentMap.get(batch.nafdacNumber) : null;

            return {
                id: record.id,
                scannedAt: record.scannedAt,
                scanOutcome: record.scanOutcome,
                drugName: batch?.drugName || 'Unknown Product',
                productImage: batch?.seal_background_url || null,
                activatingPharmacy: qr?.dispenseRecord?.pharmacy?.companyName || 'N/A',
                healthContent: healthContent ? {
                    text: record.scanOutcome === 'SUCCESS' ? healthContent.genuineText : healthContent.counterfeitText,
                    videoUrl: record.scanOutcome === 'SUCCESS' ? healthContent.genuineVideoUrl : healthContent.counterfeitVideoUrl,
                } : null
            };
        });

        res.status(200).json(history);

    } catch (error) {
        console.error('Error fetching scan history:', error);
        res.status(500).json({ error: 'An internal server error occurred while fetching your history.' });
    }
}));

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (!user.isActive) {
        return res.status(403).json({ error: 'Your account has not been approved by an administrator yet.' });
    }
    const payload = { userId: user.id, role: user.role, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({
        message: 'Login successful!',
        token: token,
        user: { id: user.id, role: user.role, companyName: user.companyName, email: user.email },
    });
}));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
    const { email, password, role, companyName, companyRegNumber, fullName } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const dataToCreate = { email: email.toLowerCase(), password: await bcrypt.hash(password, 10), role };
    let successMessage = '';

    switch (role) {
        case Role.MANUFACTURER:
        case Role.SKINCARE_BRAND:
        case Role.PHARMACY:
            if (!companyName || !companyRegNumber) return res.status(400).json({ error: 'Company Name and Registration Number are required.' });
            const existingCompany = await prisma.user.findFirst({ where: { companyRegNumber } });
            if (existingCompany) return res.status(409).json({ error: 'A company with this registration number already exists.' });
            dataToCreate.companyName = companyName;
            dataToCreate.companyRegNumber = companyRegNumber;
            dataToCreate.isActive = false;
            successMessage = 'Registration successful! Your account is pending approval.';
            break;

        case Role.CUSTOMER:
            if (!fullName) return res.status(400).json({ error: 'Full Name is required.' });
            dataToCreate.companyName = fullName;
            dataToCreate.isActive = true;
            successMessage = 'Registration successful! You can now log in.';
            break;
           
        case Role.HEALTH_ADVISOR:
        case Role.DVA:
        case Role.PRINTING:
        case Role.LOGISTICS:
            if (!fullName) return res.status(400).json({ error: 'Full Name is required.' });
            dataToCreate.companyName = fullName;
            dataToCreate.isActive = false;
            successMessage = 'Registration successful! Your account is pending approval.';
            break;

        default:
            return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    await prisma.user.create({ data: dataToCreate });
    res.status(201).json({ message: successMessage });
}));

// --- REPORTING ROUTE ---
app.get('/api/reports', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 10, status, reporterType, productName, startDate, endDate } = req.query;
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    const where = {};
    if (status) where.status = status;
    if (productName) where.productName = { contains: productName, mode: 'insensitive' };
    if (reporterType) {
        if (reporterType === 'USER') where.userId = { not: null };
        if (reporterType === 'PUBLIC') where.userId = null;
    }
    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }

    const [reports, totalCount] = await prisma.$transaction([
        prisma.report.findMany({
            where,
            include: {
                assignee: { select: { id: true, companyName: true } },
                user: { select: { id: true, companyName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSizeNum,
        }),
        prisma.report.count({ where }),
    ]);

    res.status(200).json({
        data: reports,
        pagination: {
            totalCount,
            currentPage: pageNum,
            pageSize: pageSizeNum,
            totalPages: Math.ceil(totalCount / pageSizeNum),
        },
    });
}));

app.patch('/api/reports/:id', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, assigneeId } = req.body;
    const reportId = parseInt(id, 10);

    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (assigneeId !== undefined) dataToUpdate.assigneeId = assigneeId;

    const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: dataToUpdate,
    });

    res.status(200).json(updatedReport);
}));

const reportUpload = multer({ storage: multer.memoryStorage() });

app.post('/api/reports', authenticateTokenOptional, reportUpload.array('attachments', 5), asyncHandler(async (req, res) => {
    const { productName, qrCode, issueDescription } = req.body;
    const userId = req.user ? req.user.userId : null;

    if (!productName || !issueDescription) {
        return res.status(400).json({ error: 'Product Name and Issue Description are required.' });
    }

    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const b64 = Buffer.from(file.buffer).toString("base64");
            let dataURI = "data:" + file.mimetype + ";base64," + b64;
            const uploadResult = await cloudinary.uploader.upload(dataURI, {
                folder: "criterion-mark-reports",
            });
            attachmentUrls.push(uploadResult.secure_url);
        }
    }

    const newReport = await prisma.report.create({
        data: {
            userId: userId,
            productName: productName,
            qrCode: qrCode || null,
            issueDescription: issueDescription,
            attachments: attachmentUrls,
            status: ReportStatus.NEW,
        },
    });

    res.status(201).json({ message: 'Report submitted successfully!', report: newReport });
}));

// --- MANUFACTURER ROUTES ---
app.get('/api/manufacturer/batches', authenticateToken, authorizeRole([Role.MANUFACTURER]), asyncHandler(async (req, res) => {
    const manufacturerId = req.user.userId;
    const batches = await prisma.batch.findMany({
        where: { manufacturerId: manufacturerId },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(batches);
}));

app.get('/api/manufacturer/batches/:id', authenticateToken, authorizeRole([Role.MANUFACTURER]), asyncHandler(async (req, res) => {
    const manufacturerId = req.user.userId;
    const batchId = parseInt(req.params.id, 10);
    const batch = await prisma.batch.findFirst({
        where: { id: batchId, manufacturerId: manufacturerId },
    });
    if (!batch) {
        return res.status(404).json({ error: 'Batch not found or you do not have permission to view it.' });
    }
    res.status(200).json(batch);
}));

app.post('/api/batches', authenticateToken, authorizeRole([Role.MANUFACTURER]), asyncHandler(async (req, res) => {
    const { drugName, quantity, expirationDate, nafdacNumber } = req.body;
    if (!drugName || !quantity || !expirationDate || !nafdacNumber) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const manufacturerId = req.user.userId;

    const newBatch = await prisma.batch.create({
        data: {
            manufacturerId: manufacturerId,
            drugName: drugName,
            quantity: parseInt(quantity, 10),
            expirationDate: new Date(expirationDate),
            nafdacNumber: nafdacNumber,
            status: BatchStatus.PENDING_DVA_APPROVAL,
        },
    });

    res.status(201).json(newBatch);
}));

app.put('/api/manufacturer/batches/:id/confirm-delivery', authenticateToken, authorizeRole([Role.MANUFACTURER]), asyncHandler(async (req, res) => {
    const batchId = parseInt(req.params.id, 10);
    const manufacturerId = req.user.userId;

    const batch = await prisma.batch.findFirst({
        where: { id: batchId, manufacturerId: manufacturerId }
    });

    if (!batch) {
        return res.status(404).json({ error: 'Batch not found or you do not have permission to modify it.' });
    }

    if (batch.status !== BatchStatus.PENDING_MANUFACTURER_CONFIRMATION) {
        return res.status(400).json({ error: 'This batch is not awaiting your confirmation.' });
    }

    const sixDigitCode = generateSixDigitCode();

    const updatedBatch = await prisma.batch.update({
        where: { id: batchId },
        data: { delivery_confirmation_code: sixDigitCode },
    });

    res.status(200).json({
        message: 'Confirmation code generated. Please provide this code to the logistics agent.',
        confirmationCode: sixDigitCode,
        batch: updatedBatch
    });
}));

app.post('/api/manufacturer/batches/:id/confirm-receipt', authenticateToken, authorizeRole([Role.MANUFACTURER]), asyncHandler(async (req, res) => {
    const batchId = parseInt(req.params.id, 10);
    const manufacturerId = req.user.userId;
    const { received_quantity: quantityReceived } = req.body;

    if (quantityReceived === undefined || quantityReceived === null) {
        return res.status(400).json({ error: 'Quantity received is required.' });
    }

    const batch = await prisma.batch.findFirst({
        where: { id: batchId, manufacturerId: manufacturerId }
    });

    if (!batch) {
        return res.status(404).json({ error: 'Batch not found or you do not have permission to confirm receipt.' });
    }

    if (batch.status !== BatchStatus.PENDING_MANUFACTURER_CONFIRMATION) {
        return res.status(400).json({ error: `This batch is not in the expected status ('PENDING_MANUFACTURER_CONFIRMATION'). Current status: ${batch.status}` });
    }

    const safeQuantityReceived = parseInt(quantityReceived, 10);
    if (isNaN(safeQuantityReceived) || safeQuantityReceived < 0) {
        return res.status(400).json({ error: 'Invalid quantity received. Must be a non-negative number.' });
    }

    const updatedBatch = await prisma.batch.update({
        where: { id: batchId },
        data: { manufacturer_received_quantity: safeQuantityReceived },
    });

    res.status(200).json({
        message: 'Batch receipt quantity confirmed successfully. The batch is now awaiting finalization by the logistics agent.',
        batch: updatedBatch
    });
}));
// --- MANUFACTURER MASTER QR CODE ROUTES ---

app.post('/api/manufacturer/batches/assign-children', authenticateToken, authorizeRole([Role.MANUFACTURER, Role.ADMIN]), asyncHandler(async (req, res) => {
    const { masterOuterCode, childOuterCodes } = req.body;

    if (!masterOuterCode || !childOuterCodes || !Array.isArray(childOuterCodes) || childOuterCodes.length === 0) {
        return res.status(400).json({ error: 'Master code and a list of child codes are required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
        const masterQr = await tx.qRCode.findUnique({
            where: { outerCode: masterOuterCode.trim() }
        });

        if (!masterQr) throw new Error('Master QR code not found.');
        if (!masterQr.isMaster) throw new Error('Scanned code is not a valid Master QR code.');
        if (masterQr.status !== 'UNUSED') throw new Error('This Master QR code has already been used for an assignment.');

        const childQrs = await tx.qRCode.findMany({
            where: {
                outerCode: { in: childOuterCodes },
                isMaster: false,
                status: 'AWAITING_ASSIGNMENT'
            }
        });
        
        if (childQrs.length !== childOuterCodes.length) {
            throw new Error('Some child QR codes are invalid, already assigned, or could not be found. Please check the list and try again.');
        }

        const childIdsToUpdate = childQrs.map(qr => qr.id);

        const updateCount = await tx.qRCode.updateMany({
            where: {
                id: { in: childIdsToUpdate }
            },
            data: {
                parentId: masterQr.id,
                status: 'ASSIGNED_TO_MASTER'
            }
        });

        await tx.qRCode.update({
            where: { id: masterQr.id },
            data: { status: 'USED' }
        });

        return { count: updateCount.count };
    });

    res.status(200).json({
        message: `Successfully assigned ${result.count} products to master carton ${masterOuterCode}.`
    });
}));

app.post('/api/manufacturer/master-codes/generate', authenticateToken, authorizeRole([Role.MANUFACTURER, Role.ADMIN]), asyncHandler(async (req, res) => {
    const { childOuterCodes } = req.body;

    if (!childOuterCodes || !Array.isArray(childOuterCodes) || childOuterCodes.length === 0) {
        return res.status(400).json({ error: 'A list of child product codes is required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
        const childQrs = await tx.qRCode.findMany({
            where: {
                outerCode: { in: childOuterCodes },
                isMaster: false,
                status: 'AWAITING_ASSIGNMENT'
            },
            select: { id: true, batchId: true }
        });

        if (childQrs.length !== childOuterCodes.length) {
            throw new Error('Some product codes are invalid, already assigned, or could not be found. Please scan again.');
        }

        const firstBatchId = childQrs[0].batchId;
        if (!childQrs.every(qr => qr.batchId === firstBatchId)) {
            throw new Error('All products in a carton must belong to the same manufacturing batch.');
        }

        const newMasterQr = await tx.qRCode.create({
            data: {
                batchId: firstBatchId,
                isMaster: true,
                status: 'USED',
                outerCode: `MASTER-${nanoid(10)}`,
                code: `master-inner-${nanoid(12)}`,
                smsCode: generateEightDigitCode(),
            }
        });

        const childIdsToUpdate = childQrs.map(qr => qr.id);
        const updateCount = await tx.qRCode.updateMany({
            where: {
                id: { in: childIdsToUpdate }
            },
            data: {
                parentId: newMasterQr.id,
                status: 'ASSIGNED_TO_MASTER'
            }
        });

        return { newMasterQr, count: updateCount.count };
    });

    res.status(201).json({
        message: `Successfully created Master QR and assigned ${result.count} products to it.`,
        masterCode: result.newMasterQr
    });
}));

// --- DVA ROUTES ---
app.get('/api/dva/pending-batches', authenticateToken, authorizeRole([Role.DVA]), asyncHandler(async (req, res) => {
    const pendingBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.PENDING_DVA_APPROVAL },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(pendingBatches);
}));

app.put('/api/dva/batches/:id/approve', authenticateToken, authorizeRole([Role.DVA]), asyncHandler(async (req, res) => {
    const batchId = parseInt(req.params.id, 10);
    const dvaApproverId = req.user.userId;

    const updatedBatch = await prisma.batch.update({
        where: { id: batchId },
        data: {
            status: BatchStatus.PENDING_ADMIN_APPROVAL,
            dva_approved_at: new Date(),
            dvaApproverId: dvaApproverId,
        },
    });
    res.status(200).json(updatedBatch);
}));

app.put('/api/dva/batches/:id/reject', authenticateToken, authorizeRole([Role.DVA]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectorId = req.user.userId;

    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
    }
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: {
            status: BatchStatus.DVA_REJECTED,
            rejection_reason: reason,
            dva_approved_at: new Date(),
            rejectedById: rejectorId,
        },
    });
    res.status(200).json(updatedBatch);
}));

app.get('/api/dva/history', authenticateToken, authorizeRole([Role.DVA]), asyncHandler(async (req, res) => {
    const processedBatches = await prisma.batch.findMany({
        where: { NOT: { status: BatchStatus.PENDING_DVA_APPROVAL } },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { dva_approved_at: 'desc' },
    });
    res.status(200).json(processedBatches);
}));

// --- ADMIN ROUTES ---
app.get('/api/admin/pending-batches', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const pendingBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.PENDING_ADMIN_APPROVAL },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(pendingBatches);
}));

app.delete('/api/admin/users/:id', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    const adminUserId = req.user.userId;

    if (userIdToDelete === adminUserId) {
        return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const userWithRelations = await prisma.user.findUnique({
        where: { id: userIdToDelete },
        include: {
            adminApprovedBatches: true,
            dvaApprovedBatches: true,
            rejectedBatches: true,
            uploadedHealthVideos: true,
            batches: true,
        }
    });

    if (!userWithRelations) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const hasDependencies = 
        userWithRelations.adminApprovedBatches.length > 0 ||
        userWithRelations.dvaApprovedBatches.length > 0 ||
        userWithRelations.rejectedBatches.length > 0 ||
        userWithRelations.uploadedHealthVideos.length > 0 ||
        userWithRelations.batches.length > 0;
    
    if (hasDependencies) {
        return res.status(409).json({ 
            error: 'This user cannot be deleted because they have associated action history (e.g., approved batches, created content). Please deactivate the account instead to preserve data integrity.' 
        });
    }

    await prisma.user.delete({
        where: { id: userIdToDelete }
    });

    res.status(200).json({ message: `User ${userWithRelations.email} has been permanently deleted.` });
}));

app.put('/api/admin/batches/:id/approve', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminApproverId = req.user.userId;

    const batchToProcess = await prisma.batch.findUnique({ where: { id: parseInt(id, 10) } });
    if (!batchToProcess) {
        return res.status(404).json({ error: 'Batch not found.' });
    }

    const ITEMS_PER_CARTON = 50;
    const totalQuantity = batchToProcess.quantity;
    const numberOfCartons = Math.ceil(totalQuantity / ITEMS_PER_CARTON);

    const updatedBatch = await prisma.$transaction(async (tx) => {
        const batchUpdate = await tx.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: BatchStatus.PENDING_PRINTING,
                admin_approved_at: new Date(),
                rejection_reason: null, 
                rejectedById: null,
                adminApproverId: adminApproverId,
            },
        });

        const masterCodesData = [];
        for (let i = 0; i < numberOfCartons; i++) {
            masterCodesData.push({
                outerCode: `MASTER-${nanoid(10)}`,
                code: `master-inner-${nanoid(12)}`,
                batchId: batchToProcess.id,
                isMaster: true,
                status: 'UNUSED',
            });
        }
        if (masterCodesData.length > 0) {
            await tx.qRCode.createMany({ data: masterCodesData });
        }

        const childCodesData = [];
        for (let i = 0; i < totalQuantity; i++) {
            childCodesData.push({
                code: nanoid(12),
                outerCode: `CHILD-${nanoid(10)}`,
                batchId: batchToProcess.id,
                isMaster: false,
                status: 'AWAITING_ASSIGNMENT',
            });
        }
        if (childCodesData.length > 0) {
            await tx.qRCode.createMany({ data: childCodesData });
        }
        
        return batchUpdate;
    });

    console.log(`Successfully generated ${numberOfCartons} master and ${totalQuantity} child QR pairs for Batch ID: ${batchToProcess.id}`);
    res.status(200).json(updatedBatch);
}));

app.put('/api/admin/batches/:id/reject', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectorId = req.user.userId;

    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
    }
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: {
            status: BatchStatus.ADMIN_REJECTED,
            rejection_reason: reason,
            admin_approved_at: new Date(),
            rejectedById: rejectorId,
        },
    });
    res.status(200).json(updatedBatch);
}));

app.get('/api/admin/batches/:id/codes/download', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const qrCodes = await prisma.qRCode.findMany({ where: { batchId: parseInt(id, 10) } });
    if (qrCodes.length === 0) {
        return res.status(404).json({ error: 'No QR codes found for this batch.' });
    }
    const csv = new Parser({ fields: ['code'] }).parse(qrCodes);
    res.header('Content-Type', 'text/csv');
    res.attachment(`batch_${id}_codes.csv`);
    res.send(csv);
}));

app.get('/api/admin/batches/all', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const allBatches = await prisma.batch.findMany({
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(allBatches);
}));

app.get('/api/admin/batches/:id', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const batchDetails = await prisma.batch.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                qrCodes: { orderBy: { id: 'asc' } },
                manufacturer: { select: { email: true, companyName: true } },
                dvaApprover: { select: { email: true, companyName: true } },
                adminApprover: { select: { email: true, companyName: true } },
                rejector: { select: { email: true, companyName: true } },
                printingStartedBy: { select: { email: true, companyName: true } },
                printingCompletedBy: { select: { email: true, companyName: true } },
                pickedUpBy: { select: { email: true, companyName: true } },
                finalizedDeliveryBy: { select: { email: true, companyName: true } }
            },
        });

        if (!batchDetails) {
            return res.status(404).json({ error: 'Batch not found.' });
        }
        res.status(200).json(batchDetails);
    } catch (error) {
        console.error('Error fetching batch details:', error);
        res.status(500).json({ error: 'An internal error occurred while fetching batch details.' });
    }
}));

app.post('/api/admin/batches/:id/codes/zip', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
        where: { id: parseInt(id, 10) },
        include: { qrCodes: true },
    });

    if (!batch || batch.qrCodes.length === 0) {
        return res.status(404).json({ error: 'No codes found for this batch.' });
    }
    if (!batch.seal_background_url) {
        return res.status(400).json({ error: 'Cannot generate seals because a background image has not been uploaded for this batch.' });
    }

    const zipFileName = `batch_${id}_${batch.drugName.replace(/\s+/g, '_')}_seals.zip`;
    res.attachment(zipFileName);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    const childQrs = batch.qrCodes.filter(qr => !qr.isMaster);

    for (const qr of childQrs) {
        try {
            const finalImageBuffer = await generateDualSealBuffer(qr, batch.seal_background_url);
            archive.append(finalImageBuffer, { name: `seal_${qr.code}.png` });
        } catch (error) {
            console.error(`Failed to generate seal for QR code ${qr.code}:`, error.message);
            archive.append(`Error generating seal for ${qr.code}: ${error.message}`, { name: `error_${qr.code}.txt` });
        }
    }
    await archive.finalize();
}));

app.post('/api/admin/batches/:id/upload-seal', authenticateToken, authorizeRole([Role.ADMIN]), upload.single('sealBackground'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const fileUrl = req.file.path;
    await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: { seal_background_url: fileUrl },
    });
    res.status(200).json({ message: 'Seal background uploaded successfully.', fileUrl });
}));

app.get('/api/admin/history', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const take = 20;
    const skip = (page - 1) * take;

    const whereClause = {
        NOT: { status: { in: [BatchStatus.PENDING_DVA_APPROVAL, BatchStatus.PENDING_ADMIN_APPROVAL] } },
        OR: search ? [
            { drugName: { contains: search, mode: 'insensitive' } },
            { manufacturer: { companyName: { contains: search, mode: 'insensitive' } } }
        ] : undefined,
    };

    const [batches, totalCount] = await prisma.$transaction([
        prisma.batch.findMany({
            where: whereClause,
            include: { manufacturer: { select: { companyName: true } } },
            orderBy: { admin_approved_at: 'desc' },
            take,
            skip,
        }),
        prisma.batch.count({ where: whereClause })
    ]);

    res.status(200).json({
        data: batches,
        pagination: {
            currentPage: page,
            totalCount,
            totalPages: Math.ceil(totalCount / take),
            hasNextPage: skip + take < totalCount,
        }
    });
}));

app.get('/api/admin/scans', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const allScans = await prisma.scanRecord.findMany({
        where: { ipAddress: { not: null } },
        include: { qrCode: { include: { batch: { select: { drugName: true, manufacturer: { select: { companyName: true } } } } } } },
        orderBy: { scannedAt: 'desc' },
    });
    res.status(200).json(allScans);
}));

app.get('/api/admin/admins', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const admins = await prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: { id: true, email: true, companyName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(admins);
}));

app.post('/api/admin/admins', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { email, password, adminCode } = req.body;
    if (!email || !password || !adminCode) return res.status(400).json({ error: 'All fields are required.' });
    const codeSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_creation_code' } });
    if (!codeSetting) {
        return res.status(500).json({ error: 'Admin code setting not found in database. Please re-seed.' });
    }
    const isCodeValid = await bcrypt.compare(adminCode, codeSetting.value);
    if (!isCodeValid) {
        return res.status(401).json({ error: 'Invalid Admin Code.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) return res.status(409).json({ error: 'Email already exists.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            companyName: 'Administrator',
            role: Role.ADMIN,
            isActive: true,
        },
    });
    res.status(201).json({ message: 'Admin created successfully.' });
}));

app.post('/api/admin/reset-code', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { email, newCode } = req.body;
    if (email.toLowerCase() !== req.user.email) {
        return res.status(403).json({ error: 'Unauthorized. You can only reset the code using your own email.' });
    }
    if (!newCode || !/^\d{4}$/.test(newCode)) return res.status(400).json({ error: 'New code must be 4 digits.' });
    const hashedCode = await bcrypt.hash(newCode, 10);
    await prisma.systemSetting.upsert({
        where: { key: 'admin_creation_code' },
        update: { value: hashedCode },
        create: { key: 'admin_creation_code', value: hashedCode },
    });
    res.status(200).json({ message: 'Admin code has been reset successfully.' });
}));

app.get('/api/admin/pending-users', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const pendingUsers = await prisma.user.findMany({
        where: { isActive: false, role: { not: Role.CUSTOMER } },
        orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(pendingUsers);
}));

app.get('/api/admin/users/all', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const take = 20;
    const skip = (page - 1) * take;

    const whereClause = {
        role: { not: Role.ADMIN },
        OR: search ? [
            { email: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } }
        ] : undefined,
    };

    const [users, totalCount] = await prisma.$transaction([
        prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, companyName: true, role: true, isActive: true },
            take,
            skip,
        }),
        prisma.user.count({ where: whereClause })
    ]);

    res.status(200).json({
        data: users,
        pagination: {
            currentPage: page,
            totalCount,
            totalPages: Math.ceil(totalCount / take),
            hasNextPage: skip + take < totalCount,
        }
    });
}));

app.put('/api/admin/users/:id/activate', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminApproverId = req.user.userId;
    const activatedUser = await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data: { isActive: true, approvedBy: adminApproverId, approvedAt: new Date() },
    });
    const { password, ...userWithoutPassword } = activatedUser;
    res.status(200).json(userWithoutPassword);
}));

app.put('/api/admin/users/:id/toggle-activation', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userToToggle = await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });
    if (!userToToggle) {
        return res.status(404).json({ error: 'User not found.' });
    }
    if (userToToggle.id === req.user.userId) {
        return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }
    const updatedUser = await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data: { isActive: !userToToggle.isActive },
    });
    res.status(200).json({
        message: `User ${updatedUser.email} has been ${updatedUser.isActive ? 'activated' : 'deactivated'}.`,
        user: updatedUser
    });
}));

app.post('/api/admin/system-reset', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { adminCode } = req.body;
    if (!adminCode) {
        return res.status(400).json({ error: 'Admin code is required for this action.' });
    }
    const codeSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_creation_code' } });
    if (!codeSetting || !(await bcrypt.compare(adminCode, codeSetting.value))) {
        return res.status(401).json({ error: 'Invalid Admin Code.' });
    }

    const backupData = {
        batches: await prisma.batch.findMany({ include: { manufacturer: true } }),
        users: await prisma.user.findMany(),
        qrCodes: await prisma.qRCode.findMany(),
        scanRecords: await prisma.scanRecord.findMany(),
        skincareBrands: await prisma.skincareBrand.findMany({ include: { user: true } }),
        skincareProducts: await prisma.skincareProduct.findMany({ include: { brand: true } }),
    };

    const json2csvParser = new Parser();
    const archive = archiver('zip');
    const cloudinaryUpload = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "system-backups", resource_type: "raw", public_id: `criterion_mark_backup_${new Date().toISOString()}` },
            (error, result) => error ? reject(error) : resolve(result)
        );
        archive.pipe(uploadStream);
    });

    for (const [key, data] of Object.entries(backupData)) {
        if (data.length > 0) {
            archive.append(json2csvParser.parse(data), { name: `${key}_backup.csv` });
        }
    }

    await archive.finalize();
    const uploadResult = await cloudinaryUpload;
    console.log('System backup uploaded to Cloudinary:', uploadResult.secure_url);

    await prisma.$transaction([
        prisma.scanRecord.deleteMany(),
        prisma.qRCode.deleteMany(),
        prisma.batch.deleteMany(),
        prisma.skincareProduct.deleteMany(),
        prisma.skincareBrand.deleteMany(),
    ]);

    res.status(200).json({ message: `System data has been backed up and reset successfully.` });
}));

// --- ERROR HANDLING MIDDLEWARE ---
const errorHandler = (err, req, res, next) => {
    console.error('ERROR:', err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'An internal server error occurred.',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
app.use(errorHandler);

// --- START THE SERVER ---
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});