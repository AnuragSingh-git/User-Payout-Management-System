const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../services/payoutService");

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  return {
    userId: user.userId,
    name: user.name,
    role: user.role,
    withdrawableBalance: user.withdrawableBalance,
    totalAdvancePaid: user.totalAdvancePaid,
    totalFinalPayout: user.totalFinalPayout,
  };
}

exports.register = async (req, res, next) => {
  try {
    const { userId, name, password, role } = req.body;
    if (!userId || !name || !password) {
      throw new AppError(400, "userId, name and password are required");
    }
    if (password.length < 6) {
      throw new AppError(400, "password must be at least 6 characters");
    }
    if (role && !["user", "admin"].includes(role)) {
      throw new AppError(400, "role must be 'user' or 'admin'");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    let user = await User.findOne({ userId }).select("+passwordHash");

    if (user && user.passwordHash) {
      throw new AppError(409, "This userId is already registered");
    }

    if (user) {
      user.name = name;
      user.passwordHash = passwordHash;
      if (role) user.role = role;
      await user.save();
    } else {
      user = await User.create({ userId, name, passwordHash, role: role || "user" });
    }

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) throw new AppError(400, "userId and password are required");

    const user = await User.findOne({ userId }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      throw new AppError(401, "Invalid userId or password");
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new AppError(401, "Invalid userId or password");

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) throw new AppError(404, "User not found");
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
};
