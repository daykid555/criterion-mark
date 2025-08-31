// backend/controllers/validatorController.js

import { Product, Batch, Manufacturer } from '../models/index.js'; // <-- ADJUST THIS PATH IF NEEDED
import createError from 'http-errors';

const getPendingBatches = async (req, res, next) => {
    try {
        const batches = await Batch.findAll({
            where: { status: 'PENDING_VALIDATION' },
            include: [{ model: Manufacturer, as: 'manufacturer' }]
        });
        res.json(batches);
    } catch (err) {
        next(createError(500, 'Failed to retrieve pending batches.'));
    }
};

const scanBatch = async (req, res, next) => {
    const { codes, batchId } = req.body;

    if (!codes || !Array.isArray(codes) || !batchId) {
        return next(createError(400, 'Batch ID and a list of codes are required.'));
    }

    if (codes.length === 0) {
        // Nothing to do, but it's not an error. Return an empty success.
        return res.status(200).json({ success: 0, error: 0, duplicate: 0 });
    }

    const results = { success: 0, error: 0, duplicate: 0 };

    try {
        // NOTE: Assumes your Product model has 'qrCode' and 'batchId' fields. Adjust if necessary.
        const productsInDb = await Product.findAll({ where: { qrCode: codes, batchId: batchId } });
        const productMap = new Map(productsInDb.map(p => [p.qrCode, p]));
        const codesToUpdate = [];

        for (const code of codes) {
            const product = productMap.get(code);
            if (!product) {
                // Code doesn't exist or isn't in this batch
                results.error++;
            } else if (product.status === 'UNUSED') {
                codesToUpdate.push(code);
            } else {
                // Status is VALIDATED, SOLD, etc.
                results.duplicate++;
            }
        }

        if (codesToUpdate.length > 0) {
            await Product.update({ status: 'VALIDATED' }, { where: { qrCode: codesToUpdate } });
            results.success = codesToUpdate.length;
        }

        return res.status(200).json(results);
    } catch (err) {
        console.error('Batch validation server error:', err);
        return next(createError(500, 'An unexpected error occurred during batch validation.'));
    }
};

export default { getPendingBatches, scanBatch };