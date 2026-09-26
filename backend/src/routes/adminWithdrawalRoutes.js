import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import Withdrawal from "../models/Withdrawal.js";
import {
    startProcessingWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    cancelWithdrawal
} from "../services/withdrawalService.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.post("/:withdrawalId/process", async (req, res, next) => {
    try {
        const result = await startProcessingWithdrawal({
            withdrawalId: req.params.withdrawalId,
            reviewNote: req.body.reviewNote,
            actorId: req.user._id
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

router.post("/:withdrawalId/approve", async (req, res, next) => {
    try {
        const result = await approveWithdrawal({
    withdrawalId: req.params.withdrawalId,
    reviewNote: req.body.reviewNote,
    actorId: req.user._id
});

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

router.post("/:withdrawalId/reject", async (req, res, next) => {
    try {
      const result = await rejectWithdrawal({
    withdrawalId: req.params.withdrawalId,
    rejectionReason: req.body.rejectionReason,
    reviewNote: req.body.reviewNote,
    actorId: req.user._id
});

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

router.post("/:withdrawalId/cancel", async (req, res, next) => {
    try {
        const result = await cancelWithdrawal({
    withdrawalId: req.params.withdrawalId,
    reviewNote: req.body.reviewNote,
    actorId: req.user._id
});

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});
router.get("/", async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const status = req.query.status;

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PAGE",
                    message: "Page must be a positive integer"
                }
            });
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_LIMIT",
                    message: "Limit must be an integer between 1 and 100"
                }
            });
        }

        const allowedStatuses = [
            "PENDING",
            "PROCESSING",
            "APPROVED",
            "REJECTED",
            "CANCELLED"
        ];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_WITHDRAWAL_STATUS",
                    message: "Invalid withdrawal status"
                }
            });
        }

        const filter = {};

        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Withdrawal.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: {
                withdrawals,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});
export default router;