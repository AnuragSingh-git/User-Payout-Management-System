import express from "express";

import {
  getMyProfile,
  getMyTransactions,
  getMyPayouts
} from "../controllers/user.controller.js";

import {
  protect
} from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.get(
  "/me",
  protect,
  getMyProfile
);

router.get(
  "/me/transactions",
  protect,
  getMyTransactions
);

router.get(
  "/me/payouts",
  protect,
  getMyPayouts
);

export default router;