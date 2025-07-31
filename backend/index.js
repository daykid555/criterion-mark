// backend/index.js - THE FULL, COMPLETE, AND FINAL CORRECTED CODE

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
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
import { authenticateToken } from './middleware.js';
import { Parser } from 'json2csv';
import { authorizeRole } from './middleware.js';

dotenv.config();
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE SETUP ---
const allowedOrigins = ['http://localhost:5173', 'https://criterion-mark.vercel.app'];
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) { callback(null, true); } else { callback(new Error('Not allowed by CORS')); } } }));
app.use(express.json());
app.set('trust proxy', true);

// --- CLOUDINARY & MULTER CONFIGURATION ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'criterion-mark-seals', allowed_formats: ['jpeg', 'png', 'jpg'], public_id: (req, file) => `batch-${req.params.id}-${Date.now()}` },
});
const upload = multer({ storage: storage });

// --- ROUTES ---
app.get('/', (req, res) => res.json({ message: 'Welcome to the Criterion Mark API!' }));

// --- BATCH ROUTES (for Manufacturer) ---
app.post('/api/batches', authenticateToken, authorizeRole(['MANUFACTURER']), async (req, res) => {
    try {
        const { drugName, quantity, expirationDate, nafdacNumber } = req.body;
        if (!drugName || !quantity || !expirationDate || !nafdacNumber) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const manufacturerId = req.user.userId;
        const newBatch = await prisma.batch.create({
            data: {
                drugName: drugName,
                quantity: parseInt(quantity, 10),
                expirationDate: new Date(expirationDate),
                nafdacNumber: nafdacNumber,
                manufacturerId: manufacturerId,
            },
        });
        console.log('Successfully created batch:', newBatch);
        res.status(201).json(newBatch);
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ error: 'Failed to create batch.' });
    }
});
app.get('/api/manufacturer/batches', authenticateToken, authorizeRole(['MANUFACTURER']), async (req, res) => {
    try {
        const manufacturerId = req.user.userId;
        const batches = await prisma.batch.findMany({
            where: {
                manufacturerId: manufacturerId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json(batches);
    } catch (error) {
        console.error('Error fetching manufacturer batches:', error);
        res.status(500).json({ error: 'Failed to fetch batches.' });
    }
});

// --- DVA ROUTES ---
app.get('/api/dva/pending-batches', authenticateToken, authorizeRole(['DVA']), async (req, res) => {
    try {
        const pendingBatches = await prisma.batch.findMany({
            where: {
                status: 'PENDING_DVA_APPROVAL',
            },
            include: {
                manufacturer: {
                    select: {
                        companyName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        res.status(200).json(pendingBatches);
    } catch (error) {
        console.error('Error fetching DVA pending batches:', error);
        res.status(500).json({ error: 'Failed to fetch pending batches.' });
    }
});
app.put('/api/dva/batches/:id/approve', authenticateToken, authorizeRole(['DVA']), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBatch = await prisma.batch.update({
            where: {
                id: parseInt(id, 10),
            },
            data: {
                status: 'PENDING_ADMIN_APPROVAL',
                dva_approved_at: new Date(),
                rejection_reason: null, // Clear any previous rejection reason
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error approving batch:', error);
        res.status(500).json({ error: 'Failed to approve batch.' });
    }
});

app.put('/api/dva/batches/:id/reject', authenticateToken, authorizeRole(['DVA']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required.' });
        }

        const updatedBatch = await prisma.batch.update({
            where: {
                id: parseInt(id, 10),
            },
            data: {
                status: 'DVA_REJECTED',
                rejection_reason: reason,
                dva_approved_at: new Date(), // Still record the time of action
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error rejecting batch:', error);
        res.status(500).json({ error: 'Failed to reject batch.' });
    }
});

app.get('/api/dva/history', authenticateToken, authorizeRole(['DVA']), async (req, res) => {
    try {
        const processedBatches = await prisma.batch.findMany({
            where: {
                NOT: {
                    status: 'PENDING_DVA_APPROVAL'
                }
            },
            include: {
                manufacturer: {
                    select: { companyName: true },
                },
            },
            orderBy: {
                dva_approved_at: 'desc',
            },
        });
        res.status(200).json(processedBatches);
    } catch (error) {
        console.error('Error fetching DVA history:', error);
        res.status(500).json({ error: 'Failed to fetch DVA history.' });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/pending-batches', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const pendingBatches = await prisma.batch.findMany({
            where: {
                status: 'PENDING_ADMIN_APPROVAL',
            },
            include: {
                manufacturer: {
                    select: {
                        companyName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        res.status(200).json(pendingBatches);
    } catch (error) {
        console.error('Error fetching admin pending batches:', error);
        res.status(500).json({ error: 'Failed to fetch pending batches.' });
    }
});
app.put('/api/admin/batches/:id/approve', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const batchToProcess = await prisma.batch.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!batchToProcess) {
            return res.status(404).json({ error: 'Batch not found.' });
        }
        const codesToCreate = [];
        for (let i = 0; i < batchToProcess.quantity; i++) {
            codesToCreate.push({
                code: nanoid(12),
                batchId: batchToProcess.id,
            });
        }
        const [updatedBatch, createdCodes] = await prisma.$transaction([
            prisma.batch.update({
                where: { id: parseInt(id, 10) },
                data: {
                    status: 'PENDING_PRINTING',
                    admin_approved_at: new Date(),
                    rejection_reason: null, // Clear any previous rejection reason
                },
            }),
            prisma.qRCode.createMany({
                data: codesToCreate,
            }),
        ]);
        console.log(`Successfully generated ${createdCodes.count} codes for Batch ID: ${updatedBatch.id}`);
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error in admin approval and code generation:', error);
        res.status(500).json({ error: 'Failed to approve batch and generate codes.' });
    }
});

app.put('/api/admin/batches/:id/reject', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required.' });
        }

        const updatedBatch = await prisma.batch.update({
            where: {
                id: parseInt(id, 10),
            },
            data: {
                status: 'ADMIN_REJECTED',
                rejection_reason: reason,
                admin_approved_at: new Date(), // Still record the time of action
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error rejecting batch:', error);
        res.status(500).json({ error: 'Failed to reject batch.' });
    }
});
app.get('/api/admin/batches/:id/codes/download', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const qrCodes = await prisma.qRCode.findMany({
            where: {
                batchId: parseInt(id, 10),
            },
        });
        if (qrCodes.length === 0) {
            return res.status(404).json({ error: 'No QR codes found for this batch.' });
        }
        const csvHeader = 'code\n';
        const csvRows = qrCodes.map(qr => qr.code).join('\n');
        const csvContent = csvHeader + csvRows;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="batch_${id}_codes.csv"`);
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error downloading CSV:', error);
        res.status(500).json({ error: 'Failed to download codes.' });
    }
});
app.get('/api/admin/batches/all', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const allBatches = await prisma.batch.findMany({
            include: {
                manufacturer: {
                    select: {
                        companyName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json(allBatches);
    } catch (error) {
        console.error('Error fetching all batches:', error);
        res.status(500).json({ error: 'Failed to fetch batches.' });
    }
});
app.get('/api/admin/batches/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const batchDetails = await prisma.batch.findUnique({
            where: {
                id: parseInt(id, 10),
            },
            include: {
                manufacturer: {
                    select: { companyName: true },
                },
                qrCodes: {
                    orderBy: {
                        id: 'asc',
                    },
                },
            },
        });
        if (!batchDetails) {
            return res.status(404).json({ error: 'Batch not found.' });
        }
        res.status(200).json(batchDetails);
    } catch (error) {
        console.error(`Error fetching details for batch ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch batch details.' });
    }
});
app.post('/api/admin/batches/:id/codes/zip', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
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
        const archive = archiver('zip', {
            zlib: { level: 9 },
        });
        archive.pipe(res);
        for (const qr of batch.qrCodes) {
            const qrCodeBuffer = await qrcode.toBuffer(qr.code, {
                errorCorrectionLevel: 'H', type: 'png', width: 500, margin: 2,
                color: { dark: '#000000', light: '#0000' },
            });
            const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'assets/shield-logo.svg'));
            const finalImageBuffer = await sharp(qrCodeBuffer)
                .composite([{ input: logoBuffer, gravity: 'center' }])
                .toBuffer();
            archive.append(finalImageBuffer, { name: `qr_code_${qr.code}.png` });
        }
        await archive.finalize();
    } catch (error) {
        console.error('Error creating zip file:', error);
        res.status(500).json({ error: 'Failed to create zip file.' });
    }
});
app.post('/api/admin/batches/:id/upload-seal', authenticateToken, authorizeRole(['ADMIN']), upload.single('sealBackground'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const fileUrl = req.file.path;
        await prisma.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                seal_background_url: fileUrl,
            },
        });
        res.status(200).json({ message: 'Seal background uploaded successfully.', fileUrl: fileUrl });
    } catch (error) {
        console.error('Error uploading seal background:', error);
        res.status(500).json({ error: 'Failed to upload file.' });
    }
});
app.get('/api/admin/history', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const processedBatches = await prisma.batch.findMany({
            where: {
                NOT: {
                    status: {
                        in: ['PENDING_DVA_APPROVAL', 'PENDING_ADMIN_APPROVAL']
                    }
                }
            },
            include: {
                manufacturer: { select: { companyName: true } },
            },
            orderBy: { admin_approved_at: 'desc' },
        });
        res.status(200).json(processedBatches);
    } catch (error) {
        console.error('Error fetching admin history:', error);
        res.status(500).json({ error: 'Failed to fetch history.' });
    }
});
app.get('/api/admin/scans', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const allScans = await prisma.scanRecord.findMany({
            where: {
                ipAddress: {
                    not: null,
                },
            },
            include: {
                qrCode: {
                    include: {
                        batch: {
                            select: {
                                drugName: true,
                                manufacturer: {
                                    select: {
                                        companyName: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                scannedAt: 'desc',
            },
        });
        res.status(200).json(allScans);
    } catch (error) {
        console.error('Error fetching all scan records:', error);
        res.status(500).json({ error: 'Failed to fetch scan records.' });
    }
});
app.get('/api/admin/admins', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, email: true, companyName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins.' });
    }
});
app.post('/api/admin/admins', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
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
                role: 'ADMIN',
                isActive: true,
            },
        });
        res.status(201).json({ message: 'Admin created successfully.' });
    } catch (error) {
        console.error("ADD ADMIN ERROR:", error);
        res.status(500).json({ error: 'Failed to create admin.' });
    }
});
app.post('/api/admin/reset-code', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
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
    } catch (error) {
        console.error("RESET CODE ERROR:", error);
        res.status(500).json({ error: 'Failed to reset admin code.' });
    }
});
app.get('/api/admin/pending-users', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const pendingUsers = await prisma.user.findMany({
            where: {
                isActive: false,
                role: {
                    not: 'CUSTOMER'
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ error: 'Failed to fetch pending users.' });
    }
});
app.get('/api/admin/users/all', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const users = await prisma.user.findMany({
            where: {
                role: { not: 'ADMIN' }
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, companyName: true, role: true, isActive: true }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});
app.put('/api/admin/users/:id/activate', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const adminApproverId = req.user.userId;
        const activatedUser = await prisma.user.update({
            where: {
                id: parseInt(id, 10),
            },
            data: {
                isActive: true,
                approvedBy: adminApproverId,
                approvedAt: new Date(),
            },
        });
        const { password, ...userWithoutPassword } = activatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Error activating user:', error);
        res.status(500).json({ error: 'Failed to activate user.' });
    }
});
app.put('/api/admin/users/:id/toggle-activation', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
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
    } catch (error) {
        console.error('Error toggling user activation:', error);
        res.status(500).json({ error: 'Failed to update user status.' });
    }
});
app.post('/api/admin/system-reset', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { adminCode } = req.body;
    if (!adminCode) {
        return res.status(400).json({ error: 'Admin code is required for this action.' });
    }
    const codeSetting = await prisma.systemSetting.findUnique({ where: { key: 'admin_creation_code' } });
    if (!codeSetting || !(await bcrypt.compare(adminCode, codeSetting.value))) {
        return res.status(401).json({ error: 'Invalid Admin Code.' });
    }
    try {
        const batches = await prisma.batch.findMany({ include: { manufacturer: true } });
        const users = await prisma.user.findMany();
        const qrCodes = await prisma.qRCode.findMany();
        const scanRecords = await prisma.scanRecord.findMany();
        const skincareBrands = await prisma.skincareBrand.findMany({ include: { user: true } });
        const skincareProducts = await prisma.skincareProduct.findMany({ include: { brand: true } });
        const json2csvParser = new Parser();
        const archive = archiver('zip');
        const cloudinaryUpload = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "system-backups",
                    resource_type: "raw",
                    public_id: `criterion_mark_backup_${new Date().toISOString()}`
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            archive.pipe(uploadStream);
        });
        archive.append(json2csvParser.parse(users), { name: 'users_backup.csv' });
        archive.append(json2csvParser.parse(batches), { name: 'batches_backup.csv' });
        archive.append(json2csvParser.parse(qrCodes), { name: 'qrcodes_backup.csv' });
        archive.append(json2csvParser.parse(scanRecords), { name: 'scanrecords_backup.csv' });
        archive.append(json2csvParser.parse(skincareBrands), { name: 'skincare_brands_backup.csv' });
        archive.append(json2csvParser.parse(skincareProducts), { name: 'skincare_products_backup.csv' });
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
    } catch (error) {
        console.error('CRITICAL ERROR during system reset:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'System reset failed.' });
        }
    }
});

// --- PRINTING PORTAL ROUTES ---

app.get('/api/printing/pending', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
  try {
    const pendingBatches = await prisma.batch.findMany({
      where: {
        status: 'PENDING_PRINTING',
      },
      include: {
        manufacturer: { select: { companyName: true } },
      },
      orderBy: { admin_approved_at: 'asc' },
    });
    res.status(200).json(pendingBatches);
  } catch (error) {
    console.error('Error fetching pending printing batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
});

app.get('/api/printing/in-progress', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
    try {
        const inProgressBatches = await prisma.batch.findMany({
            where: { status: 'PRINTING_IN_PROGRESS' },
            include: { manufacturer: { select: { companyName: true } } },
            orderBy: { print_started_at: 'asc' },
        });
        res.status(200).json(inProgressBatches);
    } catch (error) {
        console.error('Error fetching in-progress batches:', error);
        res.status(500).json({ error: 'Failed to fetch in-progress batches.' });
    }
});

app.put('/api/printing/batches/:id/start', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBatch = await prisma.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: 'PRINTING_IN_PROGRESS',
                print_started_at: new Date(),
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error starting print for batch:', error);
        res.status(500).json({ error: 'Failed to update batch status.' });
    }
});

app.put('/api/printing/batches/:id/complete', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBatch = await prisma.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: 'PRINTING_COMPLETE',
                print_completed_at: new Date(),
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error completing print for batch:', error);
        res.status(500).json({ error: 'Failed to update batch status.' });
    }
});

app.get('/api/printing/history', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
  try {
    const completedBatches = await prisma.batch.findMany({
      where: {
        status: {
          in: ['PRINTING_COMPLETE', 'IN_TRANSIT', 'DELIVERED']
        }
      },
      include: {
        manufacturer: { select: { companyName: true } },
      },
      orderBy: { print_completed_at: 'desc' },
    });
    res.status(200).json(completedBatches);
  } catch (error) {
    console.error('Error fetching printing history:', error);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// THIS IS THE ROUTE THAT WAS MISSING AND CAUSED THE 404 ERROR
app.get('/api/printing/batches/:id', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
    try {
        const { id } = req.params;
        const batchDetails = await prisma.batch.findUnique({
            where: {
                id: parseInt(id, 10),
            },
            include: {
                manufacturer: {
                    select: { companyName: true },
                },
                qrCodes: {
                    orderBy: {
                        id: 'asc',
                    },
                },
            },
        });
        if (!batchDetails) {
            return res.status(404).json({ error: 'Batch not found.' });
        }
        res.status(200).json(batchDetails);
    } catch (error) {
        console.error(`Error fetching printing details for batch ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to fetch batch details.' });
    }
});

app.get('/api/printing/seal/:code', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
    try {
        const { code } = req.params;
        const qrCode = await prisma.qRCode.findUnique({
            where: { code },
            include: {
                batch: { select: { seal_background_url: true } },
            },
        });
        if (!qrCode) {
            return res.status(404).json({ error: 'QR Code not found.' });
        }
        if (!qrCode.batch.seal_background_url) {
            return res.status(400).json({ error: 'No seal background has been assigned to this batch by an admin.' });
        }
        const qrCodeBuffer = await qrcode.toBuffer(code, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 200,
            margin: 1,
        });
        const backgroundResponse = await axios({
            method: 'get',
            url: qrCode.batch.seal_background_url,
            responseType: 'arraybuffer'
        });
        const backgroundBuffer = backgroundResponse.data;
        const finalImageBuffer = await sharp(backgroundBuffer)
            .composite([{
                input: qrCodeBuffer,
                top: 50,
                left: 150,
            }])
            .png()
            .toBuffer();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="seal_${code}.png"`);
        res.status(200).send(finalImageBuffer);
    } catch (error) {
        console.error('Error generating final seal:', error);
        res.status(500).json({ error: 'Failed to generate seal image.' });
    }
});

app.post('/api/printing/batch/:id/zip', authenticateToken, authorizeRole(['PRINTING']), async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await prisma.batch.findUnique({
            where: { id: parseInt(id, 10) },
            include: { qrCodes: true },
        });
        if (!batch || !batch.seal_background_url) {
            return res.status(404).json({ error: 'Batch or seal background not found.' });
        }
        const backgroundResponse = await axios({
            method: 'get',
            url: batch.seal_background_url,
            responseType: 'arraybuffer'
        });
        const backgroundBuffer = backgroundResponse.data;
        res.attachment(`batch_${id}_seals.zip`);
        const archive = archiver('zip');
        archive.on('error', function(err) {
            console.error('Archive stream error:', err);
            res.end();
        });
        archive.pipe(res);
        for (const qr of batch.qrCodes) {
            const qrCodeBuffer = await qrcode.toBuffer(qr.code, {
                errorCorrectionLevel: 'H', type: 'png', width: 200, margin: 1
            });
            const finalImageBuffer = await sharp(backgroundBuffer)
                .composite([{ input: qrCodeBuffer, top: 50, left: 150 }])
                .png()
                .toBuffer();
            archive.append(finalImageBuffer, { name: `seal_${qr.code}.png` });
        }
        await archive.finalize();
    } catch (error) {
        console.error('Error creating seal zip file:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to create zip file.' });
        }
    }
});

// --- LOGISTICS PORTAL ROUTES ---

app.get('/api/logistics/pending-pickup', authenticateToken, authorizeRole(['LOGISTICS']), async (req, res) => {
  try {
    const readyBatches = await prisma.batch.findMany({
      where: {
        status: 'PRINTING_COMPLETE',
      },
      include: {
        manufacturer: { select: { companyName: true } },
      },
      orderBy: { print_completed_at: 'asc' },
    });
    res.status(200).json(readyBatches);
  } catch (error) {
    console.error('Error fetching batches for pickup:', error);
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
});

// THIS IS THE LOGISTICS ROUTE THAT WAS CAUSING THE 500 ERROR. IT IS NOW FIXED.
app.put('/api/logistics/batches/:id/pickup', authenticateToken, authorizeRole(['LOGISTICS']), async (req, res) => {
    try {
        const { id } = req.params;
        const pickup_notes = req.body?.pickup_notes || null;

        const batch = await prisma.batch.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!batch) {
            return res.status(404).json({ error: 'Batch not found.' });
        }

        if (batch.status !== 'PRINTING_COMPLETE') {
            return res.status(400).json({ error: `Batch status is '${batch.status}', expected 'PRINTING_COMPLETE' for pickup.` });
        }

        const updatedBatch = await prisma.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: 'IN_TRANSIT',
                picked_up_at: new Date(),
                pickup_notes: pickup_notes,
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error(`Error marking batch #${req.params.id} as picked up:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Batch not found for pickup update.' });
        }
        res.status(500).json({ error: 'Failed to update batch due to an internal server error.' });
    }
});

app.put('/api/logistics/batches/:id/deliver', authenticateToken, authorizeRole(['LOGISTICS']), async (req, res) => {
    try {
        const { id } = req.params;
        const { delivery_notes } = req.body;

        const updatedBatch = await prisma.batch.update({
            where: { id: parseInt(id, 10) },
            data: {
                status: 'DELIVERED',
                delivered_at: new Date(),
                delivery_notes: delivery_notes || null,
            },
        });
        res.status(200).json(updatedBatch);
    } catch (error) {
        console.error('Error marking batch as delivered:', error);
        res.status(500).json({ error: 'Failed to update batch.' });
    }
});

app.get('/api/logistics/history', authenticateToken, authorizeRole(['LOGISTICS']), async (req, res) => {
  try {
    const deliveredBatches = await prisma.batch.findMany({
      where: { status: 'DELIVERED' },
      include: { manufacturer: { select: { companyName: true } } },
      orderBy: { delivered_at: 'desc' },
    });
    res.status(200).json(deliveredBatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logistics history.' });
  }
});

// --- SKINCARE BRAND PORTAL ROUTES ---

const getSkincareBrand = async (req, res, next) => {
    const userId = req.user.userId;
    
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
};

app.get('/api/skincare/products', authenticateToken, authorizeRole(['SKINCARE_BRAND']), getSkincareBrand, async (req, res) => {
    try {
        const products = await prisma.skincareProduct.findMany({
            where: { brandId: req.brand.id },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch skincare products.' });
    }
});

app.post('/api/skincare/products', authenticateToken, authorizeRole(['SKINCARE_BRAND']), getSkincareBrand, async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error creating skincare product:", error);
        res.status(500).json({ error: 'Failed to create skincare product.' });
    }
});

// --- PUBLIC SKINCARE VERIFICATION ROUTE ---

app.get('/api/skincare/verify/:code', async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({ status: 'error', message: 'A verification code is required.' });
        }

        const product = await prisma.skincareProduct.findUnique({
            where: { uniqueCode: code.toUpperCase() },
            include: {
                brand: {
                    select: {
                        brandName: true,
                        isVerified: true,
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'This code is invalid. The product is not registered in our system.',
            });
        }
        
        if (!product.brand.isVerified) {
             return res.status(403).json({
                status: 'error',
                message: `This product is from '${product.brand.brandName}', which is not yet a verified brand in our system.`,
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Product Verified Successfully!',
            data: product,
        });

    } catch (error) {
        console.error('Skincare verification error:', error);
        res.status(500).json({ status: 'error', message: 'An internal server error occurred.' });
    }
});

// --- PUBLIC VERIFICATION ROUTE ---
app.get('/api/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const qrCode = await prisma.qRCode.findUnique({
      where: { code: code },
      include: {
        batch: {
          include: {
            manufacturer: { select: { companyName: true } },
          },
        },
        scanRecords: {
          orderBy: { scannedAt: 'asc' },
          include: { scanner: { select: { companyName: true, role: true } } }
        }
      },
    });

    if (!qrCode) {
      return res.status(404).json({
        status: 'error',
        message: 'This code is invalid. The product is likely counterfeit.',
      });
    }

    const ip = req.ip;
    let locationData = {
      ipAddress: ip, city: null, region: null, country: null, latitude: null, longitude: null,
    };

    const useLocation = req.headers['x-use-location'] === 'true';

    if (useLocation && process.env.IPINFO_API_KEY) {
        try {
            const geoResponse = await axios.get(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY}`);
            const { city, region, country, loc } = geoResponse.data;
            
            locationData.city = city;
            locationData.region = region;
            locationData.country = country;

            if (loc) {
                const [lat, lon] = loc.split(',');
                locationData.latitude = parseFloat(lat);
                locationData.longitude = parseFloat(lon);
            }
        } catch (geoError) {
            console.error('IPinfo lookup failed:', geoError.message);
        }
    }
    
    await prisma.scanRecord.create({
      data: {
        qrCodeId: qrCode.id,
        scannedByRole: 'CUSTOMER',
        ipAddress: locationData.ipAddress,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      },
    });
    
    const updatedQrCodeDetails = await prisma.qRCode.findUnique({
      where: { id: qrCode.id },
      include: {
        batch: { include: { manufacturer: { select: { companyName: true } } } },
        scanRecords: {
          orderBy: { scannedAt: 'asc' },
        }
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product Verified Successfully!',
      data: updatedQrCodeDetails,
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred.' });
  }
});

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  try {
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

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        role: user.role,
        companyName: user.companyName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
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

    const dataToCreate = {
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: role,
    };
    
    let successMessage = '';

    switch (role) {
      case 'MANUFACTURER':
        if (!companyName || !companyRegNumber) return res.status(400).json({ error: 'Company Name and Registration Number are required.' });
        const existingCompany = await prisma.user.findFirst({ where: { companyRegNumber } });
        if (existingCompany) return res.status(409).json({ error: 'A company with this registration number already exists.' });
        dataToCreate.companyName = companyName;
        dataToCreate.companyRegNumber = companyRegNumber;
        dataToCreate.isActive = false;
        successMessage = 'Registration successful! Your account is pending approval.';
        break;

      case 'SKINCARE_BRAND':
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
      
      case 'CUSTOMER':
        if (!fullName) return res.status(400).json({ error: 'Full Name is required.' });
        dataToCreate.companyName = fullName;
        dataToCreate.isActive = true;
        successMessage = 'Registration successful! You can now log in.';
        break;

      case 'DVA':
      case 'PRINTING':
      case 'LOGISTICS':
        if (!fullName) return res.status(400).json({ error: 'Full Name / Company Name is required.' });
        dataToCreate.companyName = fullName;
        dataToCreate.isActive = false;
        successMessage = 'Registration successful! Your account is pending approval.';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    await prisma.user.create({
      data: dataToCreate,
    });

    res.status(201).json({ message: successMessage });

  } catch (error) {
    console.error('CRITICAL REGISTRATION ERROR:', error.message);
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// --- START THE SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});