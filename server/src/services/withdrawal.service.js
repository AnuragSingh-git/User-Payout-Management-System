import mongoose from "mongoose";
import User from "../models/User.js";
import Payout from "../models/Payout.js";
import Transaction from "../models/Transaction.js";

const TWENTY_FOUR_HOURS =
  24 * 60 * 60 * 1000;

export const createWithdrawal = async (
  userId,
  amount
) => {

  if (amount <= 0) {
    throw new Error(
      "Withdrawal amount must be greater than zero"
    );
  }

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    const user =
      await User.findById(userId)
        .session(session);

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    if (
      user.lastWithdrawalAt &&
      Date.now() -
        user.lastWithdrawalAt.getTime()
        <
        TWENTY_FOUR_HOURS
    ) {
      throw new Error(
        "You can make only one withdrawal every 24 hours"
      );
    }

    if (
      user.withdrawableBalance <
      amount
    ) {
      throw new Error(
        "Insufficient withdrawable balance"
      );
    }

    // Reserve money
    user.withdrawableBalance -= amount;

    user.lastWithdrawalAt =
      new Date();

    await user.save({
      session
    });

    const payout =
      await Payout.create(
        [
          {
            userId,
            amount,
            type: "withdrawal",
            status: "pending"
          }
        ],
        {
          session
        }
      );

    await Transaction.create(
      [
        {
          userId,
          amount: -amount,
          type: "withdrawal",
          referenceId:
            payout[0]._id,
          description:
            "User withdrawal initiated"
        }
      ],
      {
        session
      }
    );

    await session.commitTransaction();

    return payout[0];

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }
};