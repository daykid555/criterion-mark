// backend/index.js - FINAL CORRECTED VERSION
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient, Role, BatchStatus } from '@prisma/client';
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
import { authenticateToken, authorizeRole } from './middleware.js';
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

// --- ROUTES ---
app.get('/', (req, res) => res.json({ message: 'Welcome to the Criterion Mark API!' }));

// --- PUBLIC VERIFICATION ROUTE (REBUILT & FIXED) ---
app.get('/api/verify/:code', asyncHandler(async (req, res) => {
    const { code } = req.params;
    const ip = req.ip;
    const useLocation = req.headers['x-use-location'] === 'true';

    let locationData = { ipAddress: ip, city: null, region: null, country: null, latitude: null, longitude: null };

    if (useLocation && process.env.IPINFO_API_KEY) {
        try {
            const { data } = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY}`);
            locationData = { ...locationData, city: data.city, region: data.region, country: data.country };
            if (data.loc) {
                const [lat, lon] = data.loc.split(',');
                locationData.latitude = parseFloat(lat);
                locationData.longitude = parseFloat(lon);
            }
        } catch (geoError) {
            console.error('IPinfo lookup failed:', geoError.message);
        }
    }

    const qrCodeRecord = await prisma.qRCode.findUnique({
        where: { code: code },
        include: {
            batch: { select: { drugName: true, manufacturer: { select: { companyName: true } }, seal_background_url: true } },
            scanRecords: { where: { scannedByRole: Role.CUSTOMER }, orderBy: { scannedAt: 'asc' } },
        },
    });

    // --- Handle Case: QR Code Not Found ---
    if (!qrCodeRecord) {
        await prisma.scanRecord.create({
            data: {
                qrCodeId: null,
                scannedCode: code,
                scanOutcome: 'NOT_FOUND',
                scannedByRole: Role.CUSTOMER,
                ...locationData,
            },
        });
        return res.status(404).json({ status: 'error', message: 'This code is invalid. The product is likely counterfeit.' });
    }

    // --- Handle QR Code Found ---
    let scanOutcome = 'FAILURE';
    let message = 'This code is invalid or in a non-verifiable state.';
    let httpStatus = 400;
    
    // --- CORE LOGIC REVISED (NO VALIDATOR) ---
    // SUCCESS is now when status is UNUSED.
    // USED is a DUPLICATE error.
    if (qrCodeRecord.status === 'UNUSED') {
        scanOutcome = 'SUCCESS';
        message = 'Product Verified Successfully! This is the first verification.';
        httpStatus = 200;
    } else if (qrCodeRecord.status === 'USED') {
        scanOutcome = 'DUPLICATE';
        message = 'WARNING: This code is for a genuine product but has ALREADY BEEN VERIFIED.';
        httpStatus = 409;
    } else {
        scanOutcome = 'INVALID_STATE';
        message = `This code is in an invalid state (${qrCodeRecord.status}) and cannot be verified.`;
        httpStatus = 400;
    }

    // --- PRISMA ERROR FIX ---
    // Prepare the data for database insertion separately.
    // The 'firstScanDetails' object is for the API response only, not the database.
    const scanRecordData = {
        qrCodeId: qrCodeRecord.id,
        scannedCode: code,
        scanOutcome: scanOutcome,
        scannedByRole: Role.CUSTOMER,
        ...locationData,
    };
    
    // Prepare first scan details for the API response if it's a duplicate scan
    const firstCustomerScan = qrCodeRecord.scanRecords[0];
    let firstScanDetailsForResponse = null;
    if (firstCustomerScan) {
        firstScanDetailsForResponse = {
            scannedAt: firstCustomerScan.scannedAt,
            location: firstCustomerScan.city && firstCustomerScan.country ? `${firstCustomerScan.city}, ${firstCustomerScan.country}` : 'Unknown Location',
        };
    }

    await prisma.$transaction(async (tx) => {
        // Create the scan record without the problematic 'firstScanDetails' field.
        await tx.scanRecord.create({ data: scanRecordData });

        if (scanOutcome === 'SUCCESS') {
            await tx.qRCode.update({
                where: { id: qrCodeRecord.id },
                data: {
                    status: 'USED',
                    firstVerificationTimestamp: new Date(),
                    firstVerificationIp: locationData.ipAddress,
                    firstVerificationLocation: locationData.city ? `${locationData.city}, ${locationData.country}` : null,
                },
            });
        }
    });

    // --- Send Response ---
    const responsePayload = { status: httpStatus === 200 ? 'success' : 'error', message, data: qrCodeRecord };
    if (scanOutcome === 'DUPLICATE' && firstScanDetailsForResponse) {
        responsePayload.firstScanDetails = firstScanDetailsForResponse;
    }

    return res.status(httpStatus).json(responsePayload);
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
    const updatedBatch = await prisma.batch.update({
        where: { id: batchId },
        data: {
            status: BatchStatus.PENDING_ADMIN_APPROVAL,
            dva_approved_at: new Date(),
        },
    });
    res.status(200).json(updatedBatch);
}));

app.put('/api/dva/batches/:id/reject', authenticateToken, authorizeRole([Role.DVA]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
    }
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: {
            status: BatchStatus.DVA_REJECTED,
            rejection_reason: reason,
            dva_approved_at: new Date(),
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

app.put('/api/admin/batches/:id/approve', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const batchToProcess = await prisma.batch.findUnique({ where: { id: parseInt(id, 10) } });
    if (!batchToProcess) {
        return res.status(404).json({ error: 'Batch not found.' });
    }
    const codesToCreate = Array.from({ length: batchToProcess.quantity }, () => ({
        code: nanoid(12),
        batchId: batchToProcess.id,
    }));

    const [updatedBatch, createdCodes] = await prisma.$transaction([
        prisma.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: BatchStatus.PENDING_PRINTING,
                admin_approved_at: new Date(),
                rejection_reason: null,
            },
        }),
        prisma.qRCode.createMany({ data: codesToCreate }),
    ]);
    console.log(`Successfully generated ${createdCodes.count} codes for Batch ID: ${updatedBatch.id}`);
    res.status(200).json(updatedBatch);
}));

app.put('/api/admin/batches/:id/reject', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
    }
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: {
            status: BatchStatus.ADMIN_REJECTED,
            rejection_reason: reason,
            admin_approved_at: new Date(),
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

app.post('/api/admin/batches/:id/codes/zip', authenticateToken, authorizeRole([Role.ADMIN]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
        where: { id: parseInt(id, 10) },
        include: { qrCodes: true },
    });
    if (!batch || batch.qrCodes.length === 0) {
        return res.status(404).json({ error: 'No codes found for this batch.' });
    }
    const zipFileName = `batch_${id}_${batch.drugName.replace(/\s+/g, '_')}_qrcodes.zip`;
    res.attachment(zipFileName);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);
    const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'assets/shield-logo.svg'));
    for (const qr of batch.qrCodes) {
        const qrCodeBuffer = await qrcode.toBuffer(qr.code, {
            errorCorrectionLevel: 'H', type: 'png', width: 500, margin: 2,
            color: { dark: '#000000', light: '#0000' },
        });
        const finalImageBuffer = await sharp(qrCodeBuffer)
            .composite([{ input: logoBuffer, gravity: 'center' }])
            .toBuffer();
        archive.append(finalImageBuffer, { name: `qr_code_${qr.code}.png` });
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
    const processedBatches = await prisma.batch.findMany({
        where: { NOT: { status: { in: [BatchStatus.PENDING_DVA_APPROVAL, BatchStatus.PENDING_ADMIN_APPROVAL] } } },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { admin_approved_at: 'desc' },
    });
    res.status(200).json(processedBatches);
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
    const users = await prisma.user.findMany({
        where: { role: { not: Role.ADMIN } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, companyName: true, role: true, isActive: true }
    });
    res.status(200).json(users);
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
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: { status: BatchStatus.PRINTING_IN_PROGRESS, print_started_at: new Date() },
    });
    res.status(200).json(updatedBatch);
}));

app.put('/api/printing/batches/:id/complete', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedBatch = await prisma.batch.update({
        where: { id: parseInt(id, 10) },
        data: { status: BatchStatus.PRINTING_COMPLETE, print_completed_at: new Date() },
    });
    res.status(200).json(updatedBatch);
}));

// --- PRINTING HISTORY ROUTE (FIXED) ---
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

app.get('/api/printing/seal/:code', authenticateToken, authorizeRole([Role.PRINTING]), asyncHandler(async (req, res) => {
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
    const qrCodeBuffer = await qrcode.toBuffer(code, { errorCorrectionLevel: 'H', type: 'png', width: 200, margin: 1 });
    const backgroundResponse = await axios({ method: 'get', url: qrCode.batch.seal_background_url, responseType: 'arraybuffer' });
    const finalImageBuffer = await sharp(backgroundResponse.data)
        .composite([{ input: qrCodeBuffer, top: 50, left: 150 }])
        .png()
        .toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="seal_${code}.png"`);
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
    const backgroundResponse = await axios({ method: 'get', url: batch.seal_background_url, responseType: 'arraybuffer' });
    res.attachment(`batch_${id}_seals.zip`);
    const archive = archiver('zip');
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);
    for (const qr of batch.qrCodes) {
        const qrCodeBuffer = await qrcode.toBuffer(qr.code, { errorCorrectionLevel: 'H', type: 'png', width: 200, margin: 1 });
        const finalImageBuffer = await sharp(backgroundResponse.data)
            .composite([{ input: qrCodeBuffer, top: 50, left: 150 }])
            .png()
            .toBuffer();
        archive.append(finalImageBuffer, { name: `seal_${qr.code}.png` });
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
            if (!companyName || !companyRegNumber) return res.status(400).json({ error: 'Company Name and Registration Number are required.' });
            const existingCompany = await prisma.user.findFirst({ where: { companyRegNumber } });
            if (existingCompany) return res.status(409).json({ error: 'A company with this registration number already exists.' });
            dataToCreate.companyName = companyName;
            dataToCreate.companyRegNumber = companyRegNumber;
            dataToCreate.isActive = false;
            successMessage = 'Registration successful! Your account is pending approval.';
            break;

        case Role.SKINCARE_BRAND:
            if (!companyName || !companyRegNumber) {
                return res.status(400).json({ error: 'Brand Name and CAC Registration Number are required.' });
            }
            const existingBrand = await prisma.user.findFirst({ where: { companyRegNumber } });
            if (existingBrand) {
                return res.status(409).json({ error: 'A brand with this registration number already exists.' });
            }
            dataToCreate.companyName = companyName;
            dataToCreate.companyRegNumber = companyRegNumber;
            dataToCreate.isActive = false;
            successMessage = 'Registration successful! Your brand is pending approval from an administrator.';
            break;

        case Role.CUSTOMER:
            if (!fullName) return res.status(400).json({ error: 'Full Name is required.' });
            dataToCreate.companyName = fullName;
            dataToCreate.isActive = true;
            successMessage = 'Registration successful! You can now log in.';
            break;

        case Role.DVA:
        case Role.PRINTING:
        case Role.LOGISTICS:
            if (!fullName) return res.status(400).json({ error: 'Full Name / Company Name is required.' });
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