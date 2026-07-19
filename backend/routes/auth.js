const router = require("express").Router();
const ctrl = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/me", protect, ctrl.me);

module.exports = router;
