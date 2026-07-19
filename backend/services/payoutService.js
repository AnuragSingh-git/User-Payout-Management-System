const User = require("../models/User");
const Sale = require("../models/Sale");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");

const ADVANCE_RATE = 0.1;
const WITHDRAWAL_LOCK_MS = 24 * 60 * 60 * 1000;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function getOrCreateUser(userId, name) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = await User.create({ userId, name: name || userId });
  }
  return user;
}

async function applyLedgerEntry(userId, amount, type, meta = {}) {
  const inc = { withdrawableBalance: amount };
  if (type === "advance_payout") inc.totalAdvancePaid = amount;
  if (type === "reconciliation_credit" || type === "reconciliation_debit") {
    inc.totalFinalPayout = amount;
  }

  const user = await User.findOneAndUpdate(
    { userId },
    { $inc: inc },
    { new: true }
  );

  await Transaction.create({
    userId,
    type,
    amount,
    balanceAfter: user.withdrawableBalance,
    ...meta,
  });

  return user;
}

async function runAdvancePayoutJob({ userId } = {}) {
  const filter = { status: "pending", advancePaid: false };
  if (userId) filter.userId = userId;

  const eligibleSales = await Sale.find(filter);
  const results = [];

  for (const sale of eligibleSales) {
    const advanceAmount = round2(sale.earning * ADVANCE_RATE);

    const claimed = await Sale.findOneAndUpdate(
      { _id: sale._id, advancePaid: false },
      {
        advancePaid: true,
        advanceAmount,
        advancePaidAt: new Date(),
      },
      { new: true }
    );

    if (!claimed) continue;

    await getOrCreateUser(sale.userId);
    await applyLedgerEntry(sale.userId, advanceAmount, "advance_payout", {
      saleId: sale._id,
      note: `10% advance on sale ${sale._id}`,
    });

    results.push({ saleId: sale._id, userId: sale.userId, advanceAmount });
  }

  return { processedCount: results.length, results };
}

async function reconcileSale(saleId, newStatus) {
  if (!["approved", "rejected"].includes(newStatus)) {
    throw new AppError(400, "status must be 'approved' or 'rejected'");
  }

  const sale = await Sale.findById(saleId);
  if (!sale) throw new AppError(404, "Sale not found");
  if (sale.status !== "pending" || sale.reconciled) {
    throw new AppError(409, "Sale has already been reconciled");
  }

  const advancePaid = sale.advancePaid ? sale.advanceAmount : 0;
  const finalAmount =
    newStatus === "approved" ? round2(sale.earning - advancePaid) : round2(-advancePaid);

  const claimed = await Sale.findOneAndUpdate(
    { _id: sale._id, reconciled: false },
    {
      status: newStatus,
      reconciled: true,
      reconciledAt: new Date(),
      finalAmount,
    },
    { new: true }
  );
  if (!claimed) throw new AppError(409, "Sale has already been reconciled");

  await getOrCreateUser(sale.userId);
  if (finalAmount !== 0) {
    await applyLedgerEntry(
      sale.userId,
      finalAmount,
      finalAmount >= 0 ? "reconciliation_credit" : "reconciliation_debit",
      {
        saleId: sale._id,
        note:
          newStatus === "approved"
            ? `Approved: earning ${sale.earning} - advance ${advancePaid}`
            : `Rejected: clawback of advance ${advancePaid}`,
      }
    );
  }

  return claimed;
}

async function requestWithdrawal(userId, amount) {
  if (!(amount > 0)) throw new AppError(400, "amount must be a positive number");

  const user = await User.findOne({ userId });
  if (!user) throw new AppError(404, "User not found");

  if (amount > user.withdrawableBalance) {
    throw new AppError(400, "Insufficient withdrawable balance");
  }

  const now = new Date();
  const lockCutoff = new Date(now.getTime() - WITHDRAWAL_LOCK_MS);

  const updated = await User.findOneAndUpdate(
    {
      userId,
      withdrawableBalance: { $gte: amount },
      $or: [{ lastWithdrawalAt: null }, { lastWithdrawalAt: { $lte: lockCutoff } }],
    },
    {
      $inc: { withdrawableBalance: -amount, totalWithdrawn: amount },
      $set: { lastWithdrawalAt: now },
    },
    { new: true }
  );

  if (!updated) {
    const fresh = await User.findOne({ userId });
    if (fresh.lastWithdrawalAt && fresh.lastWithdrawalAt > lockCutoff) {
      const nextAllowedAt = new Date(fresh.lastWithdrawalAt.getTime() + WITHDRAWAL_LOCK_MS);
      const err = new AppError(429, "Only one withdrawal is allowed every 24 hours");
      err.nextAllowedAt = nextAllowedAt;
      throw err;
    }
    throw new AppError(409, "Withdrawal could not be processed, please retry");
  }

  const withdrawal = await Withdrawal.create({ userId, amount, status: "completed" });
  await Transaction.create({
    userId,
    type: "withdrawal",
    amount: -amount,
    balanceAfter: updated.withdrawableBalance,
    withdrawalId: withdrawal._id,
    note: "Withdrawal initiated",
  });

  return { withdrawal, user: updated };
}

async function updateWithdrawalStatus(withdrawalId, newStatus) {
  if (!["cancelled", "rejected", "failed"].includes(newStatus)) {
    throw new AppError(400, "status must be one of cancelled, rejected, failed");
  }

  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) throw new AppError(404, "Withdrawal not found");
  if (withdrawal.status !== "completed" || withdrawal.reversed) {
    throw new AppError(409, "Withdrawal is not in a reversible state");
  }

  const claimed = await Withdrawal.findOneAndUpdate(
    { _id: withdrawal._id, status: "completed", reversed: false },
    { status: newStatus, reversed: true, reversedAt: new Date() },
    { new: true }
  );
  if (!claimed) throw new AppError(409, "Withdrawal already processed");

  const user = await User.findOneAndUpdate(
    { userId: claimed.userId },
    {
      $inc: { withdrawableBalance: claimed.amount, totalWithdrawn: -claimed.amount },
      $set: { lastWithdrawalAt: null },
    },
    { new: true }
  );

  await Transaction.create({
    userId: claimed.userId,
    type: "withdrawal_reversal",
    amount: claimed.amount,
    balanceAfter: user.withdrawableBalance,
    withdrawalId: claimed._id,
    note: `Withdrawal marked ${newStatus} — amount credited back, lock cleared`,
  });

  return { withdrawal: claimed, user };
}

module.exports = {
  AppError,
  ADVANCE_RATE,
  WITHDRAWAL_LOCK_MS,
  getOrCreateUser,
  runAdvancePayoutJob,
  reconcileSale,
  requestWithdrawal,
  updateWithdrawalStatus,
};
