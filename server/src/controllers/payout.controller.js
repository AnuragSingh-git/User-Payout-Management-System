import mongoose from "mongoose";
import Payout from "../models/Payout.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import {
  processAdvancePayouts
} from "../services/advancePayout.service.js";
import {
  reconcileSale
} from "../services/reconciliation.service.js";
import {
  createWithdrawal
} from "../services/withdrawal.service.js";

export const runAdvancePayout = async (
  req,
  res
) => {
  try {

    const result =
      await processAdvancePayouts();

    res.json({
      message:
        "Advance payout processing completed",
      ...result
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

export const reconcile = async (
  req,
  res
) => {

  try {

    const {
      status
    } = req.body;

    const sale =
      await reconcileSale(
        req.params.saleId,
        status
      );

    res.json({
      message:
        `Sale ${status} successfully`,
      sale
    });

  } catch (error) {

    res.status(400).json({
      message: error.message
    });

  }
};

export const withdraw = async (
  req,
  res
) => {

  try {

    const {
      amount
    } = req.body;

    const payout =
      await createWithdrawal(
        req.user.id,
        Number(amount)
      );

    res.status(201).json({
      message:
        "Withdrawal initiated",
      payout
    });

  } catch (error) {

    res.status(400).json({
      message: error.message
    });

  }
};

export const paymentWebhook = async (
  req,
  res
) => {

  const session =
    await mongoose.startSession();

  try {

    const {
      payoutId,
      status,
      externalTransactionId
    } = req.body;

    const validStatuses = [
      "success",
      "failed",
      "cancelled",
      "rejected"
    ];

    if (
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid payment status"
      });
    }

    session.startTransaction();

    const payout =
      await Payout.findOne({
        _id: payoutId,
        type: "withdrawal"
      }).session(session);

    if (!payout) {
      throw new Error(
        "Payout not found"
      );
    }

    if (payout.status !== "pending") {

      await session.commitTransaction();

      return res.json({
        message:
          "Webhook already processed"
      });
    }

    payout.status = status;

    payout.externalTransactionId =
      externalTransactionId;

    await payout.save({
      session
    });

    if (
      ["failed", "cancelled", "rejected"]
        .includes(status)
    ) {

      await User.findByIdAndUpdate(
        payout.userId,
        {
          $inc: {
            withdrawableBalance:
              payout.amount
          }
        },
        {
          session
        }
      );

      await Transaction.create(
        [
          {
            userId: payout.userId,
            amount: payout.amount,
            type: "withdrawal_refund",
            referenceId: payout._id,
            description:
              "Refund for failed withdrawal"
          }
        ],
        {
          session
        }
      );
    }

    await session.commitTransaction();

    res.json({
      message:
        "Payment webhook processed"
    });

  } catch (error) {

    await session.abortTransaction();

    res.status(500).json({
      message: error.message
    });

  } finally {

    session.endSession();

  }
};