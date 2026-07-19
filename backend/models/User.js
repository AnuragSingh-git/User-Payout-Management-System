const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },

    passwordHash: { type: String, default: null, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    withdrawableBalance: { type: Number, default: 0 },

    totalAdvancePaid: { type: Number, default: 0 },
    totalFinalPayout: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },

    lastWithdrawalAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
