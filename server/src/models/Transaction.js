import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: [
        "advance",
        "final_payout",
        "rejected_adjustment",
        "withdrawal",
        "withdrawal_refund"
      ],
      required: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    description: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Transaction",
  transactionSchema
);