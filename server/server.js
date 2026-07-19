import dotenv from "dotenv";

dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

import {
  startAdvancePayoutJob
} from "./src/jobs/advancePayout.job.js";

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {

  await connectDB();

  startAdvancePayoutJob();

  app.listen(
    PORT,
    () => {
      console.log(
        `Server running on port ${PORT}`
      );
    }
  );
};

startServer();