import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      default: null
    },

    amount: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: [
        "advance",
        "final",
        "withdrawal"
      ],
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "success",
        "failed",
        "cancelled",
        "rejected"
      ],
      default: "pending"
    },

    externalTransactionId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Payout", payoutSchema);