const router = require("express").Router();
const ctrl = require("../controllers/saleController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.post("/", adminOnly, ctrl.createSale);
router.get("/", ctrl.listSales);
router.get("/:id", ctrl.getSale);
router.post("/:id/reconcile", adminOnly, ctrl.reconcile);

module.exports = router;
