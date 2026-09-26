import mongoose from "mongoose";
import { createHash } from "node:crypto";
import AdminWalletOperation from "../models/AdminWalletOperation.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AppError from "../errors/AppError.js";

import {
    creditWalletInTransaction,
    debitWalletInTransaction
} from "./walletService.js";

import { createAuditLog } from "./auditLogService.js";

const validateIdempotencyKey = (idempotencyKey) => {
    if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.trim().length === 0 ||
        idempotencyKey.trim().length > 200
    ) {
        throw new AppError(
            "A valid Idempotency-Key header is required",
            "INVALID_IDEMPOTENCY_KEY",
            400
        );
    }

    return idempotencyKey.trim();
};

const createRequestHash = ({
    operation,
    userId,
    currency,
    amount,
    description
}) => createHash("sha256")
    .update(JSON.stringify({
        operation,
        userId: String(userId),
        currency,
        amount,
        description: description ?? null
    }))
    .digest("hex");

const getStoredResult = async (operationRecord, requestHash, session = null) => {
    if (operationRecord.requestHash !== requestHash) {
        throw new AppError(
            "Idempotency key was already used for a different wallet operation",
            "IDEMPOTENCY_KEY_REUSED",
            409
        );
    }

    let transactionQuery = WalletTransaction.findOne({
        transactionId: operationRecord.transactionId
    });

    if (session) {
        transactionQuery = transactionQuery.session(session);
    }

    const transaction = await transactionQuery.lean();

    if (!transaction || !operationRecord.walletSnapshot) {
        throw new AppError(
            "Stored wallet operation is incomplete",
            "ADMIN_WALLET_OPERATION_INCOMPLETE",
            500
        );
    }

    return {
        wallet: operationRecord.walletSnapshot,
        transaction
    };
};

const executeAdminWalletOperation = async ({
    adminId,
    userId,
    currency,
    amount,
    description = null,
    idempotencyKey,
    operation
}) => {
    const normalizedKey = validateIdempotencyKey(idempotencyKey);
    const requestHash = createRequestHash({
        operation,
        userId,
        currency,
        amount,
        description
    });
    const operationFilter = {
        adminId,
        idempotencyKey: normalizedKey
    };

    const existingOperation = await AdminWalletOperation.findOne(
        operationFilter
    ).lean();

    if (existingOperation) {
        return getStoredResult(existingOperation, requestHash);
    }

    let session;

    try {
        session = await mongoose.startSession();
        let result;

        await session.withTransaction(async () => {
            const existingOperation = await AdminWalletOperation.findOne(
                operationFilter
            )
                .session(session)
                .lean();

            if (existingOperation) {
                result = await getStoredResult(
                    existingOperation,
                    requestHash,
                    session
                );
                return;
            }

            const isCredit = operation === "CREDIT";
            const descriptionText = description ||
                `Admin wallet ${operation.toLowerCase()}`;
            const mutation = isCredit
                ? await creditWalletInTransaction({
                    userId,
                    currency,
                    amount,
                    type: "ADMIN_CREDIT",
                    source: "ADMIN",
                    description: descriptionText,
                    session
                })
                : await debitWalletInTransaction({
                    userId,
                    currency,
                    amount,
                    type: "ADMIN_DEBIT",
                    source: "ADMIN",
                    description: descriptionText,
                    session
                });

            await createAuditLog({
                actorId: adminId,
                action: isCredit ? "WALLET_CREDIT" : "WALLET_DEBIT",
                targetUserId: userId,
                targetType: "Wallet",
                referenceId: mutation.transaction.transactionId,
                metadata: {
                    currency,
                    amount,
                    transactionId: mutation.transaction.transactionId,
                    description: descriptionText
                },
                session
            });

            const walletSnapshot = mutation.wallet.toObject();
            const transactionId = mutation.transaction.transactionId;

            await AdminWalletOperation.create(
                [{
                    ...operationFilter,
                    requestHash,
                    operation,
                    transactionId,
                    walletSnapshot
                }],
                { session }
            );

            result = {
                wallet: walletSnapshot,
                transaction: mutation.transaction.toObject()
            };
        });

        return result;
    } catch (error) {
        if (session) {
            await session.endSession();
            session = null;
        }

        let committedOperation;
        try {
            committedOperation = await AdminWalletOperation.findOne(
                operationFilter
            ).lean();
        } catch {
            throw error;
        }

        if (committedOperation) {
            return getStoredResult(committedOperation, requestHash);
        }

        throw error;
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

export const adminCreditWallet = (args) => executeAdminWalletOperation({
    ...args,
    operation: "CREDIT"
});

export const adminDebitWallet = (args) => executeAdminWalletOperation({
    ...args,
    operation: "DEBIT"
});