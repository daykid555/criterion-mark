import express from 'express';
import { PrismaClient, BatchStatus, Role } from '@prisma/client';
import { authenticateToken, authorizeRole } from '../middleware.js';

const prisma = new PrismaClient();
const router = express.Router();

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// --- VALIDATOR ROUTES ---

// GET /api/validator/pending-batches
router.get('/pending-batches', authenticateToken, authorizeRole([Role.VALIDATOR]), asyncHandler(async (req, res) => {
    const pendingBatches = await prisma.batch.findMany({
        where: { status: BatchStatus.VALIDATION_PENDING },
        include: { manufacturer: { select: { companyName: true } } },
        orderBy: { print_completed_at: 'asc' },
    });
    res.status(200).json(pendingBatches);
}));

// POST /api/validator/scan
router.post('/scan', authenticateToken, authorizeRole([Role.VALIDATOR]), asyncHandler(async (req, res) => {
    const { qrCode, batchId } = req.body;
    const validatorId = req.user.userId;

    if (!qrCode || !batchId) {
        return res.status(400).json({ status: 'error', message: 'QR Code and Batch ID are required.' });
    }

    const codeRecord = await prisma.qRCode.findUnique({ where: { code: qrCode } });

    if (!codeRecord) {
        return res.status(404).json({ status: 'error', message: `Code ${qrCode} not found in database.` });
    }
    if (codeRecord.batchId !== parseInt(batchId)) {
        return res.status(400).json({ status: 'error', message: `Code ${qrCode} does not belong to this batch.` });
    }
    if (codeRecord.status !== 'UNUSED') {
        return res.status(409).json({ status: 'error', message: `Code ${qrCode} has already been scanned (Status: ${codeRecord.status}).` });
    }

    await prisma.$transaction([
        prisma.qRCode.update({
            where: { id: codeRecord.id },
            data: { status: 'VALIDATED' },
        }),
        prisma.validationRecord.create({
            data: {
                qrCodeId: codeRecord.id,
                batchId: parseInt(batchId),
                validatorId: validatorId,
            },
        }),
    ]);

    res.status(200).json({ status: 'success', message: `Code ${qrCode} validated successfully.` });
}));

// GET /api/validator/batches/:id/status
router.get('/batches/:id/status', authenticateToken, authorizeRole([Role.VALIDATOR]), asyncHandler(async (req, res) => {
    const batchId = parseInt(req.params.id, 10);

    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { quantity: true, status: true }
    });

    if (!batch) {
        return res.status(404).json({ error: 'Batch not found.' });
    }

    const validatedCount = await prisma.qRCode.count({
        where: {
            batchId: batchId,
            status: 'VALIDATED'
        }
    });

    const unvalidatedCount = await prisma.qRCode.count({
        where: {
            batchId: batchId,
            status: 'UNUSED'
        }
    });

    res.status(200).json({
        totalCodes: batch.quantity,
        validatedCodes: validatedCount,
        unvalidatedCodes: unvalidatedCount,
        batchStatus: batch.status
    });
}));

// PUT /api/validator/batches/:id/complete-validation
router.put('/batches/:id/complete-validation', authenticateToken, authorizeRole([Role.VALIDATOR]), asyncHandler(async (req, res) => {
    const batchId = parseInt(req.params.id, 10);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });

    if (!batch) {
        return res.status(404).json({ error: 'Batch not found.' });
    }
    if (batch.status !== BatchStatus.VALIDATION_PENDING) {
        return res.status(400).json({ error: `Batch is not pending validation. Current status: ${batch.status}` });
    }

    const validatedCount = await prisma.qRCode.count({ where: { batchId: batchId, status: 'VALIDATED' } });
    if (validatedCount !== batch.quantity) {
        return res.status(400).json({ error: 'Not all QR codes in this batch have been validated.', total: batch.quantity, validated: validatedCount, remaining: batch.quantity - validatedCount });
    }

    const updatedBatch = await prisma.batch.update({ where: { id: batchId }, data: { status: BatchStatus.PRINTING_COMPLETE } });
    res.status(200).json({ message: 'Batch validation complete. Ready for logistics pickup.', batch: updatedBatch });
}));

export default router;