import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const reconcileSale = async (
  saleId,
  newStatus
) => {

  if (
    !["approved", "rejected"]
      .includes(newStatus)
  ) {
    throw new Error(
      "Invalid reconciliation status"
    );
  }

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    const sale =
      await Sale.findOne({
        _id: saleId,
        status: "pending"
      }).session(session);

    if (!sale) {
      throw new Error(
        "Sale not found or already reconciled"
      );
    }

    sale.status = newStatus;

    sale.reconciledAt = new Date();

    await sale.save({
      session
    });

    if (newStatus === "approved") {

      const finalAmount =
        Number(
          (
            sale.earning -
            sale.advancePaid
          ).toFixed(2)
        );

      if (finalAmount > 0) {

        await User.findByIdAndUpdate(
          sale.userId,
          {
            $inc: {
              withdrawableBalance:
                finalAmount
            }
          },
          {
            session
          }
        );

        await Transaction.create(
          [
            {
              userId: sale.userId,
              amount: finalAmount,
              type: "final_payout",
              referenceId: sale._id,
              description:
                `Final payout for approved sale ${sale._id}`
            }
          ],
          {
            session
          }
        );
      }

    } else {

      // Rejected sale.
      // Recover previously paid advance.

      const adjustment =
        sale.advancePaid;

      if (adjustment > 0) {

        await User.findByIdAndUpdate(
          sale.userId,
          {
            $inc: {
              withdrawableBalance:
                -adjustment
            }
          },
          {
            session
          }
        );

        await Transaction.create(
          [
            {
              userId: sale.userId,
              amount: -adjustment,
              type: "rejected_adjustment",
              referenceId: sale._id,
              description:
                `Recovery of advance for rejected sale ${sale._id}`
            }
          ],
          {
            session
          }
        );
      }
    }

    await session.commitTransaction();

    return sale;

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }
};