import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import AuditLog from "../models/AuditLog.js";
import PayoutOption from "../models/PayoutOption.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Withdrawal from "../models/Withdrawal.js";

dotenv.config();

const demoEmail = "demo@veloop.test";
const demoPassword = process.env.DEMO_USER_PASSWORD;
const demoWithdrawalId = "WD_DEMO_001";
const demoTransactionId = "TXN_DEMO_WITHDRAWAL_001";
const dayInMilliseconds = 24 * 60 * 60 * 1000;

const walletBalances = {
  ves: 25000,
  sves: 5000,
  gems: 100,
  tokens: 500,
  spins: 3
};

const createTransaction = ({
  transactionId,
  userId,
  walletId,
  currency,
  direction,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  referenceId,
  description,
  createdAt
}) => ({
  transactionId,
  userId,
  walletId,
  currency,
  direction,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  source: direction === "DEBIT" ? "WITHDRAWAL" : "DEMO_SEED",
  referenceId,
  status: "COMPLETED",
  description,
  metadata: { demoData: true },
  createdAt,
  updatedAt: createdAt
});

const seedDemoData = async () => {
  let session;

  try {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Demo data seeding is allowed only when NODE_ENV=development.");
    }

    if (typeof demoPassword !== "string" || demoPassword.length < 8) {
      throw new Error("Set DEMO_USER_PASSWORD to a local password of at least 8 characters.");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI must be configured before seeding demo data.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const payoutOption = await PayoutOption.findOne({
      optionId: "UPI_10",
      active: true
    }).lean();

    if (!payoutOption) {
      throw new Error("Active UPI_10 payout option not found. Run npm run seed:payouts first.");
    }

    const passwordHash = await bcrypt.hash(demoPassword, 12);
    const seededAt = new Date();
    const requestedAt = new Date(seededAt.getTime() - 60 * 60 * 1000);
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      let user = await User.findOne({ email: demoEmail }).session(session);

      if (!user) {
        [user] = await User.create(
          [
            {
              email: demoEmail,
              name: "VELOop Demo User",
              passwordHash,
              role: "USER",
              accountStatus: "ACTIVE"
            }
          ],
          { session }
        );
      } else {
        user.name = "VELOop Demo User";
        user.passwordHash = passwordHash;
        user.role = "USER";
        user.accountStatus = "ACTIVE";
      }

      const wallet = await Wallet.findOneAndUpdate(
        { userId: user._id },
        { $set: walletBalances },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          session
        }
      );

      user.walletId = wallet._id;
      await user.save({ session });

      await Withdrawal.deleteMany({ userId: user._id }, { session });
      await WalletTransaction.deleteMany({ userId: user._id }, { session });
      await AuditLog.deleteMany({ referenceId: demoWithdrawalId }, { session });

      const transactions = [
        createTransaction({
          transactionId: "TXN_DEMO_VE_AD_REWARD",
          userId: user._id,
          walletId: wallet._id,
          currency: "VE",
          direction: "CREDIT",
          type: "AD_REWARD",
          amount: 25000,
          balanceBefore: 0,
          balanceAfter: 25000,
          referenceId: "DEMO_AD_REWARD_001",
          description: "Demo watch-ad reward",
          createdAt: new Date(seededAt.getTime() - 3 * dayInMilliseconds)
        }),
        createTransaction({
          transactionId: "TXN_DEMO_VE_DAILY_REWARD",
          userId: user._id,
          walletId: wallet._id,
          currency: "VE",
          direction: "CREDIT",
          type: "DAILY_REWARD",
          amount: payoutOption.requiredAmount,
          balanceBefore: 25000,
          balanceAfter: 25000 + payoutOption.requiredAmount,
          referenceId: "DEMO_DAILY_REWARD_001",
          description: "Demo daily reward",
          createdAt: new Date(seededAt.getTime() - 2 * dayInMilliseconds)
        }),
        createTransaction({
          transactionId: demoTransactionId,
          userId: user._id,
          walletId: wallet._id,
          currency: payoutOption.currency,
          direction: "DEBIT",
          type: "WITHDRAWAL",
          amount: payoutOption.requiredAmount,
          balanceBefore: walletBalances.ves + payoutOption.requiredAmount,
          balanceAfter: walletBalances.ves,
          referenceId: demoWithdrawalId,
          description: `Withdrawal for ${payoutOption.name}`,
          createdAt: requestedAt
        }),
        createTransaction({
          transactionId: "TXN_DEMO_SVE_BONUS",
          userId: user._id,
          walletId: wallet._id,
          currency: "SVE",
          direction: "CREDIT",
          type: "BONUS",
          amount: walletBalances.sves,
          balanceBefore: 0,
          balanceAfter: walletBalances.sves,
          referenceId: "DEMO_SVE_BONUS_001",
          description: "Demo SVE bonus",
          createdAt: new Date(seededAt.getTime() - 2 * dayInMilliseconds)
        }),
        createTransaction({
          transactionId: "TXN_DEMO_GEM_REWARD",
          userId: user._id,
          walletId: wallet._id,
          currency: "GEM",
          direction: "CREDIT",
          type: "REWARD",
          amount: walletBalances.gems,
          balanceBefore: 0,
          balanceAfter: walletBalances.gems,
          referenceId: "DEMO_GEM_REWARD_001",
          description: "Demo gem reward",
          createdAt: new Date(seededAt.getTime() - dayInMilliseconds)
        }),
        createTransaction({
          transactionId: "TXN_DEMO_TOKEN_REFERRAL",
          userId: user._id,
          walletId: wallet._id,
          currency: "TOKEN",
          direction: "CREDIT",
          type: "REFERRAL",
          amount: walletBalances.tokens,
          balanceBefore: 0,
          balanceAfter: walletBalances.tokens,
          referenceId: "DEMO_TOKEN_REFERRAL_001",
          description: "Demo referral token reward",
          createdAt: new Date(seededAt.getTime() - dayInMilliseconds)
        }),
        createTransaction({
          transactionId: "TXN_DEMO_SPIN_GAME_REWARD",
          userId: user._id,
          walletId: wallet._id,
          currency: "SPIN",
          direction: "CREDIT",
          type: "GAME_REWARD",
          amount: walletBalances.spins,
          balanceBefore: 0,
          balanceAfter: walletBalances.spins,
          referenceId: "DEMO_SPIN_REWARD_001",
          description: "Demo game reward spins",
          createdAt: new Date(seededAt.getTime() - 12 * 60 * 60 * 1000)
        })
      ];

      await WalletTransaction.insertMany(transactions, { session });

      await Withdrawal.create(
        [
          {
            withdrawalId: demoWithdrawalId,
            userId: user._id,
            walletId: wallet._id,
            method: payoutOption.method,
            optionId: payoutOption.optionId,
            currency: payoutOption.currency,
            currencyAmount: payoutOption.requiredAmount,
            payoutAmount: payoutOption.payoutAmount,
            payoutCurrency: payoutOption.payoutCurrency,
            payoutDetails: { upiId: "demo@upi" },
            status: "PENDING",
            transactionId: demoTransactionId,
            idempotencyKey: "demo-seed-withdrawal-001",
            requestedAt,
            createdAt: requestedAt,
            updatedAt: requestedAt
          }
        ],
        { session }
      );

      await AuditLog.create(
        [
          {
            actorId: user._id,
            action: "WITHDRAWAL_CREATED",
            targetUserId: user._id,
            targetType: "Withdrawal",
            referenceId: demoWithdrawalId,
            metadata: {
              optionId: payoutOption.optionId,
              method: payoutOption.method,
              currencyAmount: payoutOption.requiredAmount,
              payoutAmount: payoutOption.payoutAmount,
              demoData: true
            },
            createdAt: requestedAt,
            updatedAt: requestedAt
          }
        ],
        { session }
      );
    });

    console.log(`Demo data seeded for ${demoEmail}`);
  } catch (error) {
    console.error("Demo data seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (session) {
      await session.endSession();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

seedDemoData();