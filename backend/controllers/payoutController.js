const Transaction = require("../models/Transaction");
const { runAdvancePayoutJob, AppError } = require("../services/payoutService");
const { isSelfOrAdmin } = require("../middleware/auth");

exports.runAdvanceJob = async (req, res, next) => {
  try {
    const { userId } = req.body || {};
    const summary = await runAdvancePayoutJob({ userId });
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

exports.listTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isSelfOrAdmin(req, userId)) throw new AppError(403, "Forbidden");
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};
