import mongoose from "mongoose";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AppError from "../errors/AppError.js";
import {
  InvalidCurrencyError,
  WalletNotFoundError,
  InsufficientBalanceError,
  WalletBalanceLimitError
} from "../errors/WalletErrors.js";
import { createAuditLog } from "./auditLogService.js";
import {
  validateAmount,
  validateCurrency,
  validateSource,
  validateCreditTransactionType,
  validateDebitTransactionType
} from "../validators/walletValidators.js";

import {
  CURRENCIES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_TYPES,
  CURRENCY_FIELD_MAP,
  MAX_WALLET_BALANCE
} from "../constants/enums.js";

const getCurrencyField = (currency) => {
  if (!CURRENCIES.includes(currency)) {
    throw new InvalidCurrencyError();
  }

  return CURRENCY_FIELD_MAP[currency];
};


const getUserWallet = async (userId, session = null) => {
  const userQuery = User.findById(userId).select("walletId");

  if (session) {
    userQuery.session(session);
  }

  const user = await userQuery;

  if (!user || !user.walletId) {
    throw new WalletNotFoundError();
  }

  const walletQuery = Wallet.findOne({
    _id: user.walletId,
    userId: user._id
  });

  if (session) {
    walletQuery.session(session);
  }

  const wallet = await walletQuery;

  if (!wallet) {
    throw new WalletNotFoundError();
  }

  return wallet;
};

const createTransactionId = () => {
  return `TXN_${new mongoose.Types.ObjectId().toString()}`;
};

const createLedgerEntry = async ({
  session,
  userId,
  walletId,
  currency,
  direction,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  source,
  referenceId = null,
  description = null,
  metadata = {}
}) => {
  const transaction = await WalletTransaction.create(
    [
      {
        transactionId: createTransactionId(),
        userId,
        walletId,
        currency,
        direction,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        source,
        referenceId,
        status: "COMPLETED",
        description,
        metadata
      }
    ],
    { session }
  );

  return transaction[0];
};

export const creditWallet = async ({
  userId,
  currency,
  amount,
  type,
  source,
  referenceId = null,
  description = null,
  metadata = {}
}) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await creditWalletInTransaction({
        userId,
        currency,
        amount,
        type,
        source,
        referenceId,
        description,
        metadata,
        session
      });
    });

    return {
      wallet: result.wallet.toObject(),
      transaction: result.transaction.toObject()
    };
  } finally {
    await session.endSession();
  }
};

export const creditWalletInTransaction = async ({
  userId,
  currency,
  amount,
  type,
  source,
  referenceId = null,
  description = null,
  metadata = {},
  session
}) => {
  validateAmount(amount);
  validateCurrency(currency);
  validateSource(source);
  validateCreditTransactionType(type);

  const walletField = getCurrencyField(currency);

  const wallet = await getUserWallet(userId, session);

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      _id: wallet._id,
      [walletField]: {
        $lte: MAX_WALLET_BALANCE - amount
      }
    },
    {
      $inc: {
        [walletField]: amount
      }
    },
    {
      returnDocument: "after",
      session
    }
  );

  if (!updatedWallet) {
    throw new WalletBalanceLimitError();
  }

  const balanceAfter = updatedWallet[walletField];
  const balanceBefore = balanceAfter - amount;

  const transaction = await createLedgerEntry({
    session,
    userId,
    walletId: updatedWallet._id,
    currency,
    direction: "CREDIT",
    type,
    amount,
    balanceBefore,
    balanceAfter,
    source,
    referenceId,
    description,
    metadata
  });

  return {
    wallet: updatedWallet,
    transaction
  };
};

export const debitWalletInTransaction = async ({
  userId,
  currency,
  amount,
  type,
  source,
  referenceId = null,
  description = null,
  metadata = {},
  session
}) => {
  validateAmount(amount);
  validateCurrency(currency);
  validateSource(source);
  validateDebitTransactionType(type);

  const walletField = getCurrencyField(currency);

  const wallet = await getUserWallet(userId, session);

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      _id: wallet._id,
      [walletField]: {
        $gte: amount
      }
    },
    {
      $inc: {
        [walletField]: -amount
      }
    },
    {
      returnDocument: "after",
      session
    }
  );

  if (!updatedWallet) {
    throw new InsufficientBalanceError();
  }

  const balanceAfter = updatedWallet[walletField];
  const balanceBefore = balanceAfter + amount;

  const transaction = await createLedgerEntry({
    session,
    userId,
    walletId: updatedWallet._id,
    currency,
    direction: "DEBIT",
    type,
    amount,
    balanceBefore,
    balanceAfter,
    source,
    referenceId,
    description,
    metadata
  });

  return {
    wallet: updatedWallet,
    transaction
  };
};

export const debitWallet = async ({
  userId,
  currency,
  amount,
  type,
  source,
  referenceId = null,
  description = null,
  metadata = {},
  session = null
}) => {
  if (session) {
    return debitWalletInTransaction({
      userId,
      currency,
      amount,
      type,
      source,
      referenceId,
      description,
      metadata,
      session
    });
  }

  const walletSession = await mongoose.startSession();

  try {
    let result;

    await walletSession.withTransaction(async () => {
      result = await debitWalletInTransaction({
        userId,
        currency,
        amount,
        type,
        source,
        referenceId,
        description,
        metadata,
        session: walletSession
      });
    });

    return {
      wallet: result.wallet.toObject(),
      transaction: result.transaction.toObject()
    };
  } finally {
    await walletSession.endSession();
  }
};

export const getWallet = async (userId) => {
  const wallet = await getUserWallet(userId);

  return {
    wallet: wallet.toObject()
  };
};

export const getWalletSummary = async (userId) => {
  const wallet = await getUserWallet(userId);

  return {
    ves: wallet.ves,
    sves: wallet.sves,
    gems: wallet.gems,
    tokens: wallet.tokens,
    spins: wallet.spins
  };
};

export const validateBalance = async ({
  userId,
  currency,
  amount
}) => {
  validateAmount(amount);
  validateCurrency(currency);

  const walletField = getCurrencyField(currency);

  const wallet = await Wallet.findOne({
    userId
  })
    .select(walletField)
    .lean();

  if (!wallet) {
    throw new WalletNotFoundError();
  }

  const balance = wallet[walletField];

  return {
    sufficient: balance >= amount,
    balance,
    required: amount,
    currency
  };
};

export const getTransactions = async ({
  userId,
  page = 1,
  limit = 20,
  currency = null,
  direction = null
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

  if (currency !== null) {
    if (!CURRENCIES.includes(currency)) {
      throw new InvalidCurrencyError();
    }

    filter.currency = currency;
  }

  if (direction !== null) {
    if (!TRANSACTION_DIRECTIONS.includes(direction)) {
      throw new AppError(
        "Invalid transaction direction",
        "INVALID_DIRECTION",
        400
      );
    }

    filter.direction = direction;
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    WalletTransaction.countDocuments(filter)
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};