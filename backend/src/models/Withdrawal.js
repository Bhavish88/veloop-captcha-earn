import mongoose from "mongoose";
import {
  CURRENCIES,
  PAYOUT_METHODS,
  WITHDRAWAL_STATUS,
  MAX_WALLET_BALANCE
} from "../constants/enums.js";

const withdrawalSchema = new mongoose.Schema(
  {
    withdrawalId: {
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
      immutable: true
    },

    method: {
      type: String,
      enum: PAYOUT_METHODS,
      required: true,
      immutable: true
    },

    optionId: {
      type: String,
      required: true,
      immutable: true,
      index: true,
      trim: true
    },

    currency: {
      type: String,
      enum: CURRENCIES,
      required: true,
      immutable: true
    },

    currencyAmount: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_WALLET_BALANCE,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Currency amount must be a safe integer"
      }
    },

    payoutAmount: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_WALLET_BALANCE,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Payout amount must be a safe integer"
      }
    },

    payoutCurrency: {
      type: String,
      required: true,
      default: "INR",
      immutable: true,
      trim: true
    },

    payoutDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    status: {
      type: String,
      enum: WITHDRAWAL_STATUS,
      required: true,
      default: "PENDING",
      index: true
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500
    },

    reviewNote: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000
    },

    transactionId: {
      type: String,
      required: true,
      immutable: true,
      index: true,
      trim: true
    },

    idempotencyKey: {
      type: String,
      required: true,
      immutable: true,
      trim: true
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true
    },

    processingAt: {
      type: Date,
      default: null
    },

    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

withdrawalSchema.index({
  userId: 1,
  createdAt: -1
});

withdrawalSchema.index({
  status: 1,
  createdAt: -1
});

withdrawalSchema.index(
  {
    userId: 1,
    idempotencyKey: 1
  },
  {
    unique: true
  }
);

const Withdrawal = mongoose.model(
  "Withdrawal",
  withdrawalSchema
);

export default Withdrawal;