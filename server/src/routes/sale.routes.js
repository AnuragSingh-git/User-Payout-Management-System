import express from "express";

import {
  createSale,
  getMySales,
  getPendingSales
} from "../controllers/sale.controller.js";

import {
  protect,
  adminOnly
} from "../middleware/auth.middleware.js";

const router =
  express.Router();

router.post(
  "/",
  protect,
  adminOnly,
  createSale
);

router.get(
  "/my",
  protect,
  getMySales
);

router.get(
  "/pending",
  protect,
  adminOnly,
  getPendingSales
);

export default router;