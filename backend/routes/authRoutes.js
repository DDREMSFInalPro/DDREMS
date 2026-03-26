/**
 * Auth Routes
 *
 * POST /api/auth/register  - Register owner or buyer
 * POST /api/auth/login     - Login any role
 * GET  /api/auth/me        - Get current user (protected)
 */
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  registerValidation,
  loginValidation,
} = require("../controllers/authController");
const authenticate = require("../middleware/auth");

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", authenticate, getMe);

module.exports = router;
