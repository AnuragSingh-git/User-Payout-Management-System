const router = require("express").Router();
const ctrl = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.post("/", adminOnly, ctrl.createUser);
router.get("/", adminOnly, ctrl.listUsers);
router.get("/:userId", ctrl.getUser);

module.exports = router;
