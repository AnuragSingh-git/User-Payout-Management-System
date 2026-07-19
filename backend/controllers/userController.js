const User = require("../models/User");
const { getOrCreateUser, AppError } = require("../services/payoutService");
const { isSelfOrAdmin } = require("../middleware/auth");

exports.createUser = async (req, res, next) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name) throw new AppError(400, "userId and name are required");
    const existing = await User.findOne({ userId });
    if (existing) throw new AppError(409, "User already exists");
    const user = await User.create({ userId, name });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    if (!isSelfOrAdmin(req, req.params.userId)) throw new AppError(403, "Forbidden");
    const user = await getOrCreateUser(req.params.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
};
