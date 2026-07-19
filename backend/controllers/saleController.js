const Sale = require("../models/Sale");
const { getOrCreateUser, reconcileSale, AppError } = require("../services/payoutService");
const { isSelfOrAdmin } = require("../middleware/auth");

exports.createSale = async (req, res, next) => {
  try {
    const { userId, brand, earning, status } = req.body;
    if (!userId || !brand || earning === undefined) {
      throw new AppError(400, "userId, brand and earning are required");
    }
    if (earning < 0) throw new AppError(400, "earning must be >= 0");

    await getOrCreateUser(userId);

    const sale = await Sale.create({
      userId,
      brand,
      earning,
      status: status || "pending",
    });
    res.status(201).json(sale);
  } catch (err) {
    next(err);
  }
};

exports.listSales = async (req, res, next) => {
  try {
    const { status } = req.query;
    let { userId } = req.query;

    if (req.user.role !== "admin") userId = req.user.userId;

    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    next(err);
  }
};

exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) throw new AppError(404, "Sale not found");
    if (!isSelfOrAdmin(req, sale.userId)) throw new AppError(403, "Forbidden");
    res.json(sale);
  } catch (err) {
    next(err);
  }
};

exports.reconcile = async (req, res, next) => {
  try {
    const { status } = req.body;
    const sale = await reconcileSale(req.params.id, status);
    res.json(sale);
  } catch (err) {
    next(err);
  }
};
