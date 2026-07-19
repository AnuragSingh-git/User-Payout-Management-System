const Withdrawal = require("../models/Withdrawal");
const { requestWithdrawal, updateWithdrawalStatus, AppError } = require("../services/payoutService");
const { isSelfOrAdmin } = require("../middleware/auth");

exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (amount === undefined) throw new AppError(400, "amount is required");
    const result = await requestWithdrawal(req.user.userId, Number(amount));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.listWithdrawals = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isSelfOrAdmin(req, userId)) throw new AppError(403, "Forbidden");
    const withdrawals = await Withdrawal.find({ userId }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await updateWithdrawalStatus(req.params.id, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.listAllWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
};
