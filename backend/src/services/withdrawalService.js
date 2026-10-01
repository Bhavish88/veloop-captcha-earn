import mongoose from "mongoose";
import Withdrawal from "../models/Withdrawal.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Wallet from "../models/Wallet.js";
import { createAuditLog } from "./auditLogService.js";
import {
    InvalidPayoutDetailsError,
    WithdrawalNotFoundError
} from "../errors/WithdrawalErrors.js";
import User from "../models/User.js";
import {
    debitWalletInTransaction,
    creditWalletInTransaction
} from "./walletService.js";
import { validatePayoutDetails } from "../validators/payoutValidators.js";
import {
    getPayoutOption
} from "./payoutOptionService.js";
import {
    validateAmount,
    validateCurrency
} from "../validators/walletValidators.js";
import AppError from "../errors/AppError.js";
import { WITHDRAWAL_STATUS } from "../constants/enums.js";
import { WITHDRAWAL_TRANSITIONS } from "../constants/withdrawalTransitions.js";

const toPlainObject = (document) =>
    typeof document?.toObject === "function"
        ? document.toObject()
        : document;

export const createWithdrawal = async ({
    userId,
    optionId,
    payoutDetails,
    idempotencyKey
}) => {
    if (!userId) {
        throw new AppError(
            "User ID is required",
            "USER_ID_REQUIRED",
            400
        );
    }

    if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.trim().length === 0
    ) {
        throw new AppError(
            "Idempotency key is required",
            "IDEMPOTENCY_KEY_REQUIRED",
            400
        );
    }

    idempotencyKey = idempotencyKey.trim();

    if (
        !payoutDetails ||
        typeof payoutDetails !== "object" ||
        Array.isArray(payoutDetails)
    ) {
        throw new InvalidPayoutDetailsError();
    }

    const user = await User.findById(userId)
        .select("_id accountStatus walletId")
        .lean();

    if (!user) {
        throw new AppError(
            "User not found",
            "USER_NOT_FOUND",
            404
        );
    }

    if (user.accountStatus !== "ACTIVE") {
        throw new AppError(
            "Account is not active",
            "ACCOUNT_NOT_ACTIVE",
            403
        );
    }

    /*
     * Idempotency check:
     * If this user has already submitted this operation,
     * return the existing withdrawal instead of creating
     * another debit.
     */
    const existingWithdrawal = await Withdrawal.findOne({
        userId,
        idempotencyKey
    }).lean();

    if (existingWithdrawal) {
        const transaction = await WalletTransaction.findOne({
            transactionId: existingWithdrawal.transactionId
        }).lean();

        if (!transaction) {
            throw new AppError(
                "Withdrawal transaction not found",
                "WITHDRAWAL_TRANSACTION_NOT_FOUND",
                500
            );
        }

        const wallet = await Wallet.findById(
            existingWithdrawal.walletId
        ).lean();

        if (!wallet) {
            throw new AppError(
                "Withdrawal wallet not found",
                "WITHDRAWAL_WALLET_NOT_FOUND",
                500
            );
        }

        return {
            withdrawal: existingWithdrawal,
            transaction,
            wallet,
            idempotent: true
        };
    }

    const payoutOption = await getPayoutOption(optionId);

    validatePayoutDetails(
        payoutOption.method,
        payoutDetails
    );

    validateCurrency(payoutOption.currency);
    validateAmount(payoutOption.requiredAmount);

    

    let session;

    try {
        session = await mongoose.startSession();

        let result;

        await session.withTransaction(async () => {
            const existingWithdrawal = await Withdrawal.findOne({
                userId,
                idempotencyKey
            }).session(session);

            if (existingWithdrawal) {
                const transaction = await WalletTransaction.findOne({
                    transactionId: existingWithdrawal.transactionId
                })
                    .session(session)
                    .lean();

                const wallet = await Wallet.findById(
                    existingWithdrawal.walletId
                )
                    .session(session)
                    .lean();

                result = {
                    withdrawal: existingWithdrawal,
                    transaction,
                    wallet,
                    idempotent: true
                };

                return;
            }

            const debitResult = await debitWalletInTransaction({
                userId,
                currency: payoutOption.currency,
                amount: payoutOption.requiredAmount,
                type: "WITHDRAWAL",
                source: "WITHDRAWAL",
                referenceId: idempotencyKey,
                description: `Withdrawal for ${payoutOption.name}`,
                metadata: {
                    optionId: payoutOption.optionId,
                    payoutAmount: payoutOption.payoutAmount,
                    payoutCurrency: payoutOption.payoutCurrency
                },
                session
            });

            const withdrawalId =
                `WD_${new mongoose.Types.ObjectId().toString()}`;

            const withdrawal = await Withdrawal.create(
                [
                    {
                        withdrawalId,
                        userId,
                        walletId: debitResult.wallet._id,
                        method: payoutOption.method,
                        optionId: payoutOption.optionId,
                        currency: payoutOption.currency,
                        currencyAmount: payoutOption.requiredAmount,
                        payoutAmount: payoutOption.payoutAmount,
                        payoutCurrency: payoutOption.payoutCurrency,
                        payoutDetails,
                        status: "PENDING",
                        transactionId:
                            debitResult.transaction.transactionId,
                        idempotencyKey
                    }
                ],
                { session }
            );
await createAuditLog({
    actorId: userId,
    action: "WITHDRAWAL_CREATED",
    targetUserId: userId,
    targetType: "Withdrawal",
    referenceId: withdrawal[0].withdrawalId,
    metadata: {
        optionId: payoutOption.optionId,
        method: payoutOption.method,
        currency: payoutOption.currency,
        currencyAmount: payoutOption.requiredAmount,
        payoutAmount: payoutOption.payoutAmount
    },
    session
});
            result = {
                withdrawal: withdrawal[0],
                transaction: debitResult.transaction,
                wallet: debitResult.wallet,
                idempotent: false
            };
        });

        return {
            withdrawal: toPlainObject(result.withdrawal),
            transaction: toPlainObject(result.transaction),
            wallet: toPlainObject(result.wallet),
            idempotent: result.idempotent
        };

    } catch (error) {

        /*
         * The transaction may fail because another concurrent
         * request already completed the same idempotent operation.
         *
         * End the transaction session first, then perform the
         * recovery lookup outside the transaction.
         */
        if (session) {
            await session.endSession();
            session = null;
        }

        const existingWithdrawal = await Withdrawal.findOne({
            userId,
            idempotencyKey
        }).lean();

        if (existingWithdrawal) {
            const transaction = await WalletTransaction.findOne({
                transactionId: existingWithdrawal.transactionId
            }).lean();

           const wallet = await Wallet.findById(
    existingWithdrawal.walletId
).lean();

if (!transaction || !wallet) {
    throw new AppError(
        "Existing withdrawal data is incomplete",
        "WITHDRAWAL_DATA_INCOMPLETE",
        500
    );
}

const walletField = {
    VE: "ves",
    SVE: "sves",
    GEM: "gems",
    TOKEN: "tokens",
    SPIN: "spins"
}[transaction.currency];

if (!walletField) {
    throw new AppError(
        "Invalid transaction currency",
        "INVALID_TRANSACTION_CURRENCY",
        500
    );
}

return {
    withdrawal: existingWithdrawal,
    transaction,
    wallet,
    idempotent: true
};
        }

        throw error;

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

const validateStatusTransition = (currentStatus, newStatus) => {
    const allowedStatuses =
        WITHDRAWAL_TRANSITIONS[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
        throw new AppError(
            `Invalid withdrawal status transition: ${currentStatus} → ${newStatus}`,
            "INVALID_WITHDRAWAL_TRANSITION",
            400
        );
    }
};

export const startProcessingWithdrawal = async ({
    withdrawalId,
    reviewNote = null,
    actorId
}) => {
    if (
        typeof withdrawalId !== "string" ||
        withdrawalId.trim().length === 0
    ) {
        throw new AppError(
            "Withdrawal ID is required",
            "WITHDRAWAL_ID_REQUIRED",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const withdrawal = await Withdrawal.findOne({
                withdrawalId
            }).session(session);

            if (!withdrawal) {
                throw new WithdrawalNotFoundError();
            }

            validateStatusTransition(withdrawal.status, "PROCESSING");

            withdrawal.status = "PROCESSING";
            withdrawal.processingAt = new Date();
            withdrawal.reviewNote = reviewNote
                ? reviewNote.trim()
                : null;

            await withdrawal.save({ session });
            await createAuditLog({
                actorId,
                action: "WITHDRAWAL_PROCESSING",
                targetUserId: withdrawal.userId,
                targetType: "Withdrawal",
                referenceId: withdrawal.withdrawalId,
                metadata: {
                    fromStatus: "PENDING",
                    toStatus: "PROCESSING",
                    reviewNote: withdrawal.reviewNote
                },
                session
            });

            result = withdrawal;
        });

        return {
            withdrawal: result.toObject()
        };
    } finally {
        await session.endSession();
    }
};

export const rejectWithdrawal = async ({
    withdrawalId,
    rejectionReason,
    reviewNote = null,
    actorId
}) => {
    if (
        typeof withdrawalId !== "string" ||
        withdrawalId.trim().length === 0
    ) {
        throw new AppError(
            "Withdrawal ID is required",
            "WITHDRAWAL_ID_REQUIRED",
            400
        );
    }

    if (
        typeof rejectionReason !== "string" ||
        rejectionReason.trim().length === 0
    ) {
        throw new AppError(
            "Rejection reason is required",
            "REJECTION_REASON_REQUIRED",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const withdrawal = await Withdrawal.findOne({
                withdrawalId
            }).session(session);

            if (!withdrawal) {
                throw new WithdrawalNotFoundError();
            }

            validateStatusTransition(
                withdrawal.status,
                "REJECTED"
            );

            const reversalResult = await creditWalletInTransaction({
                userId: withdrawal.userId,
                currency: withdrawal.currency,
                amount: withdrawal.currencyAmount,
                type: "WITHDRAWAL_REVERSAL",
                source: "WITHDRAWAL_REJECTION",
                referenceId: withdrawal.withdrawalId,
                description: `Reversal for rejected withdrawal ${withdrawal.withdrawalId}`,
                metadata: {
                    withdrawalId: withdrawal.withdrawalId,
                    originalTransactionId: withdrawal.transactionId
                },
                session
            });

            withdrawal.status = "REJECTED";
            withdrawal.rejectionReason = rejectionReason.trim();
            withdrawal.reviewNote = reviewNote
                ? reviewNote.trim()
                : null;
            withdrawal.processedAt = new Date();

            await withdrawal.save({ session });
await createAuditLog({
    actorId,
    action: "WITHDRAWAL_REJECTED",
    targetUserId: withdrawal.userId,
    targetType: "Withdrawal",
    referenceId: withdrawal.withdrawalId,
    metadata: {
        rejectionReason: withdrawal.rejectionReason,
        reviewNote: withdrawal.reviewNote,
        reversalTransactionId: reversalResult.transaction.transactionId
    },
    session
});
            result = {
                withdrawal,
                wallet: reversalResult.wallet,
                transaction: reversalResult.transaction
            };
        });

        return {
            withdrawal: result.withdrawal.toObject(),
            wallet: result.wallet.toObject(),
            transaction: result.transaction.toObject()
        };
    } finally {
        await session.endSession();
    }
};

export const approveWithdrawal = async ({
    withdrawalId,
    reviewNote = null,
    actorId
}) => {
    if (
        typeof withdrawalId !== "string" ||
        withdrawalId.trim().length === 0
    ) {
        throw new AppError(
            "Withdrawal ID is required",
            "WITHDRAWAL_ID_REQUIRED",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const withdrawal = await Withdrawal.findOne({
                withdrawalId
            }).session(session);

            if (!withdrawal) {
                throw new WithdrawalNotFoundError();
            }

            validateStatusTransition(
                withdrawal.status,
                "APPROVED"
            );

            withdrawal.status = "APPROVED";
            withdrawal.reviewNote = reviewNote
                ? reviewNote.trim()
                : null;
            withdrawal.processedAt = new Date();

            await withdrawal.save({ session });
await createAuditLog({
    actorId,
    action: "WITHDRAWAL_APPROVED",
    targetUserId: withdrawal.userId,
    targetType: "Withdrawal",
    referenceId: withdrawal.withdrawalId,
    metadata: {
        reviewNote,
        approvalMeaning: "APPROVED_FOR_PAYOUT",
        settlementRecorded: false
    },
    session
});
            result = withdrawal;
        });

        return {
            withdrawal: result.toObject()
        };
    } finally {
        await session.endSession();
    }
};


export const cancelWithdrawal = async ({
    withdrawalId,
    reviewNote = null,
    actorId
}) => {
    if (
        typeof withdrawalId !== "string" ||
        withdrawalId.trim().length === 0
    ) {
        throw new AppError(
            "Withdrawal ID is required",
            "WITHDRAWAL_ID_REQUIRED",
            400
        );
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const withdrawal = await Withdrawal.findOne({
                withdrawalId
            }).session(session);

            if (!withdrawal) {
                throw new WithdrawalNotFoundError();
            }

            validateStatusTransition(
                withdrawal.status,
                "CANCELLED"
            );

            const reversalResult = await creditWalletInTransaction({
                userId: withdrawal.userId,
                currency: withdrawal.currency,
                amount: withdrawal.currencyAmount,
                type: "WITHDRAWAL_REVERSAL",
                source: "WITHDRAWAL_CANCELLATION",
                referenceId: withdrawal.withdrawalId,
                description: `Reversal for cancelled withdrawal ${withdrawal.withdrawalId}`,
                metadata: {
                    withdrawalId: withdrawal.withdrawalId,
                    originalTransactionId: withdrawal.transactionId
                },
                session
            });

            withdrawal.status = "CANCELLED";
            withdrawal.reviewNote = reviewNote
                ? reviewNote.trim()
                : null;
            withdrawal.processedAt = new Date();

            await withdrawal.save({ session });
            await createAuditLog({
    actorId,
    action: "WITHDRAWAL_CANCELLED",
    targetUserId: withdrawal.userId,
    targetType: "Withdrawal",
    referenceId: withdrawal.withdrawalId,
    metadata: {
        reviewNote: withdrawal.reviewNote,
        reversalTransactionId: reversalResult.transaction.transactionId
    },
    session
});

            result = {
                withdrawal,
                wallet: reversalResult.wallet,
                transaction: reversalResult.transaction
            };
        });

        return {
            withdrawal: result.withdrawal.toObject(),
            wallet: result.wallet.toObject(),
            transaction: result.transaction.toObject()
        };
    } finally {
        await session.endSession();
    }
};

export const getWithdrawal = async (userId, withdrawalId) => {
    if (!userId) {
        throw new AppError(
            "User ID is required",
            "USER_ID_REQUIRED",
            400
        );
    }

    if (
        typeof withdrawalId !== "string" ||
        withdrawalId.trim().length === 0
    ) {
        throw new AppError(
            "Withdrawal ID is required",
            "WITHDRAWAL_ID_REQUIRED",
            400
        );
    }

    const withdrawal = await Withdrawal.findOne({
        withdrawalId,
        userId
    }).lean();

    if (!withdrawal) {
        throw new WithdrawalNotFoundError();
    }

    return {
        withdrawal
    };
};
export const getWithdrawals = async ({
    userId,
    page = 1,
    limit = 20,
    status = null
}) => {
    if (!Number.isInteger(page) || page < 1) {
        throw new AppError(
            "Page must be a positive integer",
            "INVALID_PAGE",
            400
        );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError(
            "Limit must be between 1 and 100",
            "INVALID_LIMIT",
            400
        );
    }

   const filter = {
    userId
};

if (status !== null) {
    if (!WITHDRAWAL_STATUS.includes(status)) {
        throw new AppError(
            "Invalid withdrawal status",
            "INVALID_WITHDRAWAL_STATUS",
            400
        );
    }

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

    return {
        withdrawals,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};