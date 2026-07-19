const router = require("express").Router();
const ctrl = require("../controllers/withdrawalController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/", adminOnly, ctrl.listAllWithdrawals);
router.get("/:userId", ctrl.listWithdrawals);
router.patch("/:id/status", adminOnly, ctrl.updateStatus);

module.exports = router;
