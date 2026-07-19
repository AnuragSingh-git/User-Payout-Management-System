const router = require("express").Router();
const ctrl = require("../controllers/payoutController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.post("/advance/run", adminOnly, ctrl.runAdvanceJob);
router.get("/transactions/:userId", ctrl.listTransactions);

module.exports = router;
