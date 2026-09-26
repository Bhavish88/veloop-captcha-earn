import mongoose from "mongoose";

const adminWalletOperationSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },

    idempotencyKey: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      maxlength: 200
    },

    requestHash: {
      type: String,
      required: true,
      immutable: true,
      match: /^[a-f0-9]{64}$/
    },

    operation: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      immutable: true
    },

    transactionId: {
      type: String,
      required: true,
      immutable: true,
      unique: true,
      trim: true
    },

    walletSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      immutable: true
    }
  },
  {
    timestamps: true
  }
);

adminWalletOperationSchema.index(
  {
    adminId: 1,
    idempotencyKey: 1
  },
  {
    unique: true
  }
);

const AdminWalletOperation = mongoose.model(
  "AdminWalletOperation",
  adminWalletOperationSchema
);

export default AdminWalletOperation;