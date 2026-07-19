import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Payout from "../models/Payout.js";

export const getMyProfile = async (
  req,
  res
) => {

  try {

    const user =
      await User.findById(
        req.user.id
      ).select(
        "-password"
      );

    res.json({
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

export const getMyTransactions = async (
  req,
  res
) => {

  try {

    const transactions =
      await Transaction.find({
        userId: req.user.id
      })
        .sort({
          createdAt: -1
        });

    res.json({
      transactions
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

export const getMyPayouts = async (
  req,
  res
) => {

  try {

    const payouts =
      await Payout.find({
        userId: req.user.id
      })
        .sort({
          createdAt: -1
        });

    res.json({
      payouts
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};