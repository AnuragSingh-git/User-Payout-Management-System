import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import User from "../models/User.js";
import Payout from "../models/Payout.js";
import Transaction from "../models/Transaction.js";

export const processAdvancePayouts = async () => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const sales = await Sale.find({
      status: "pending",
      advanceTransferred: false
    }).session(session);

    let processedCount = 0;

    for (const sale of sales) {

      const advance =
        Number(
          (sale.earning * 0.10).toFixed(2)
        );

      if (advance <= 0) {
        continue;
      }

      // Atomic protection against duplicate processing
      const lockedSale =
        await Sale.findOneAndUpdate(
          {
            _id: sale._id,
            status: "pending",
            advanceTransferred: false
          },
          {
            $set: {
              advanceTransferred: true,
              advancePaid: advance
            }
          },
          {
            new: true,
            session
          }
        );

      if (!lockedSale) {
        continue;
      }

      await User.findByIdAndUpdate(
        sale.userId,
        {
          $inc: {
            withdrawableBalance: advance
          }
        },
        {
          session
        }
      );

      await Payout.create(
        [
          {
            userId: sale.userId,
            saleId: sale._id,
            amount: advance,
            type: "advance",
            status: "success"
          }
        ],
        {
          session
        }
      );

      await Transaction.create(
        [
          {
            userId: sale.userId,
            amount: advance,
            type: "advance",
            referenceId: sale._id,
            description:
              `10% advance payout for sale ${sale._id}`
          }
        ],
        {
          session
        }
      );

      processedCount++;
    }

    await session.commitTransaction();

    return {
      processedCount
    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }
};