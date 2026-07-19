import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    withdrawableBalance: {
      type: Number,
      default: 0,
      min: 0
    },

    lastWithdrawalAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);