const mongoose = require("mongoose");

const WITHDRAWAL_STATUS = ["completed", "cancelled", "rejected", "failed"];

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: WITHDRAWAL_STATUS, default: "completed" },

    reversed: { type: Boolean, default: false },
    reversedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
module.exports.WITHDRAWAL_STATUS = WITHDRAWAL_STATUS;
