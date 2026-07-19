import express from "express";

import {
  runAdvancePayout,
  reconcile,
  withdraw,
  paymentWebhook
} from "../controllers/payout.controller.js";

import {
  protect,
  adminOnly
} from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.post(
  "/advance/run",
  protect,
  adminOnly,
  runAdvancePayout
);

router.patch(
  "/sales/:saleId/reconcile",
  protect,
  adminOnly,
  reconcile
);

router.post(
  "/withdraw",
  protect,
  withdraw
);

router.post(
  "/webhook",
  paymentWebhook
);

export default router;