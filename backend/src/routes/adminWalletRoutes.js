import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { adminWalletRateLimiter } from "../middleware/rateLimitMiddleware.js";
import {
    adminCreditWallet,
    adminDebitWallet
} from "../services/adminWalletService.js";

import { createAuditLog } from "../services/auditLogService.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);



router.post("/credit",adminWalletRateLimiter, async (req, res, next) => {
    try {
        const {
            userId,
            currency,
            amount,
            description
        } = req.body;

        const result = await adminCreditWallet({
            adminId: req.user._id,
            userId,
            currency,
            amount,
            description,
            idempotencyKey: req.get("Idempotency-Key")
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

router.post("/debit",adminWalletRateLimiter, async (req, res, next) => {
    try {
        const {
            userId,
            currency,
            amount,
            description
        } = req.body;

        const result = await adminDebitWallet({
            adminId: req.user._id,
            userId,
            currency,
            amount,
            description,
            idempotencyKey: req.get("Idempotency-Key")
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

export default router;