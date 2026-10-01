import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import errorHandler from "./errors/errorHandler.js";
import walletRoutes from "./routes/walletRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";
import adminWithdrawalRoutes from "./routes/adminWithdrawalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import adminWalletRoutes from "./routes/adminWalletRoutes.js";
import reconcileRoutes from "./routes/reconcile.js"
import cors from "cors";
dotenv.config();

export const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
];

app.use(helmet());

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json());
app.use(mongoSanitize());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "VELoop Rewards backend is running"
    });
});


app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin/reconciliation", reconcileRoutes);
app.use(errorHandler);

export const startServer = async () => {
    await connectDatabase();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

if (process.env.NODE_ENV !== "test") {
    startServer();
}