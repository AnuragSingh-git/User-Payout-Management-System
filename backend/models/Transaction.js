const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "advance_payout",
        "reconciliation_credit",
        "reconciliation_debit",
        "withdrawal",
        "withdrawal_reversal",
      ],
      required: true,
    },
    amount: { type: Number, required: true }, // signed: +credit / -debit
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", default: null },
    withdrawalId: { type: mongoose.Schema.Types.ObjectId, ref: "Withdrawal", default: null },
    balanceAfter: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
