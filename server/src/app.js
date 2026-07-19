import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes
  from "./routes/auth.routes.js";

import saleRoutes
  from "./routes/sale.routes.js";

import payoutRoutes
  from "./routes/payout.routes.js";

import userRoutes
  from "./routes/user.routes.js";

import {
  notFound,
  errorHandler
} from "./middleware/error.middleware.js";


const app = express();

app.use(cors());

app.use(express.json());

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Payout Management API is running"
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/sales",
  saleRoutes
);

app.use(
  "/api/payouts",
  payoutRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(notFound);

app.use(errorHandler);


export default app;