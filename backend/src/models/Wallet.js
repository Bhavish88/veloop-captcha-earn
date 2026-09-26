import mongoose from "mongoose";
import { MAX_WALLET_BALANCE } from "../constants/enums.js";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      immutable: true,
      index: true
    },

    ves: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: MAX_WALLET_BALANCE,
      validate: {
        validator: Number.isSafeInteger,
        message: "VEs must be a safe integer"
      }
    },

    sves: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: MAX_WALLET_BALANCE,
      validate: {
        validator: Number.isSafeInteger,
        message: "SVEs must be a safe integer"
      }
    },

    gems: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: MAX_WALLET_BALANCE,
      validate: {
        validator: Number.isSafeInteger,
        message: "Gems must be a safe integer"
      }
    },

    tokens: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: MAX_WALLET_BALANCE,
      validate: {
        validator: Number.isSafeInteger,
        message: "Tokens must be a safe integer"
      }
    },

    spins: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: MAX_WALLET_BALANCE,
      validate: {
        validator: Number.isSafeInteger,
        message: "Spins must be a safe integer"
      }
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;