const mongoose = require("mongoose");

const SALE_STATUS = ["pending", "approved", "rejected"];

const saleSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    brand: { type: String, required: true },
    earning: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: SALE_STATUS,
      default: "pending",
      index: true,
    },

    advancePaid: { type: Boolean, default: false },
    advanceAmount: { type: Number, default: 0 },
    advancePaidAt: { type: Date, default: null },

    reconciled: { type: Boolean, default: false },
    finalAmount: { type: Number, default: null },
    reconciledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

saleSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Sale", saleSchema);
module.exports.SALE_STATUS = SALE_STATUS;
