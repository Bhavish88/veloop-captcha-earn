import mongoose from "mongoose";
import {
  CURRENCIES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  MAX_WALLET_BALANCE
} from "../constants/enums.js";

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
      trim: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      immutable: true,
      index: true
    },

    currency: {
      type: String,
      enum: CURRENCIES,
      required: true,
      immutable: true
    },

    direction: {
      type: String,
      enum: TRANSACTION_DIRECTIONS,
      required: true,
      immutable: true
    },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
      immutable: true
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_WALLET_BALANCE,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Transaction amount must be a safe integer"
      }
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
      max: MAX_WALLET_BALANCE,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Balance before must be a safe integer"
      }
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
      max: MAX_WALLET_BALANCE,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Balance after must be a safe integer"
      }
    },

    source: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      maxlength: 100
    },

    referenceId: {
      type: String,
      default: null,
      immutable: true,
      index: true,
      trim: true
    },

    status: {
      type: String,
      enum: TRANSACTION_STATUS,
      default: "COMPLETED",
      required: true,
      immutable: true
    },

    description: {
      type: String,
      default: null,
      immutable: true,
      trim: true,
      maxlength: 500
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      immutable: true
    }
  },
  {
    timestamps: true
  }
);

walletTransactionSchema.index({
  userId: 1,
  createdAt: -1
});

walletTransactionSchema.index({
  walletId: 1,
  createdAt: -1
});

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

export default WalletTransaction;