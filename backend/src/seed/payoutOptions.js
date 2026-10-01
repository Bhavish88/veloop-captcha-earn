import mongoose from "mongoose";
import dotenv from "dotenv";
import PayoutOption from "../models/PayoutOption.js";

dotenv.config();

const payoutTiers = [
  { requiredAmount: 2400, payoutAmount: 10 },
  { requiredAmount: 5800, payoutAmount: 25 },
  { requiredAmount: 10000, payoutAmount: 50 },
  { requiredAmount: 19500, payoutAmount: 100 },
  { requiredAmount: 28500, payoutAmount: 150 },
  { requiredAmount: 52500, payoutAmount: 300 },
  { requiredAmount: 80500, payoutAmount: 500 },
  { requiredAmount: 150000, payoutAmount: 1000 }
];

const payoutMethods = [
  { method: "UPI", name: "UPI", type: "UPI" },
  { method: "PAYPAL", name: "PayPal", type: "PAYPAL" },
  { method: "AMAZON", name: "Amazon Pay", type: "GIFT_CARD" },
  { method: "GOOGLE_PLAY", name: "Google Play", type: "GIFT_CARD" }
];

const payoutOptions = payoutMethods.flatMap(({ method, name, type }) =>
  payoutTiers.map(({ requiredAmount, payoutAmount }) => ({
    optionId: `${method}_${payoutAmount}`,
    method,
    name: `₹${payoutAmount} ${name}`,
    type,
    currency: "VE",
    requiredAmount,
    payoutAmount,
    payoutCurrency: "INR",
    active: true
  }))
);

const seedPayoutOptions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await PayoutOption.deleteMany({
      optionId: {
        $in: payoutOptions.map(({ optionId }) => optionId)
      }
    });

    await PayoutOption.insertMany(payoutOptions);

    console.log("Payout options seeded successfully");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Payout option seeding failed:", error.message);
    process.exit(1);
  }
};

seedPayoutOptions();