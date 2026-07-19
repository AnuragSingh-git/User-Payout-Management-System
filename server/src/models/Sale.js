import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    brand: {
      type: String,
      required: true,
      trim: true
    },

    earning: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },

    advancePaid: {
      type: Number,
      default: 0
    },

    advanceTransferred: {
      type: Boolean,
      default: false
    },

    reconciledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Sale", saleSchema);