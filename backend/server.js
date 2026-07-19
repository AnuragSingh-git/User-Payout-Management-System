require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/sales");
const payoutsRoutes = require("./routes/payouts");
const withdrawalsRoutes = require("./routes/withdrawals");
const usersRoutes = require("./routes/users");

if (!process.env.JWT_SECRET) {
  console.warn(
    "[server] WARNING: JWT_SECRET not set in .env — using an insecure dev fallback. Set JWT_SECRET before deploying."
  );
  process.env.JWT_SECRET = "dev-only-insecure-secret-change-me";
}

const app = express();

app.use(cors({
  origin: "https://user-payout-management-system-3ly3bvrms.vercel.app/" || "*",
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "payout-system-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/payouts", payoutsRoutes);
app.use("/api/withdrawals", withdrawalsRoutes);
app.use("/api/users", usersRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(err.nextAllowedAt ? { nextAllowedAt: err.nextAllowedAt } : {}),
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
});

module.exports = app;
