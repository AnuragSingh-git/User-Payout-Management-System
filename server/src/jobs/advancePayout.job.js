import cron from "node-cron";

import {
  processAdvancePayouts
} from "../services/advancePayout.service.js";

export const startAdvancePayoutJob = () => {

  // Every day at midnight
  cron.schedule(
    "0 0 * * *",
    async () => {

      try {

        console.log(
          "Starting advance payout job..."
        );

        const result =
          await processAdvancePayouts();

        console.log(
          "Advance payout completed:",
          result
        );

      } catch (error) {

        console.error(
          "Advance payout job failed:",
          error
        );

      }
    }
  );

};