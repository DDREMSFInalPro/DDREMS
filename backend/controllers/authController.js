/**
 * Auth Controller
 * Unified authentication for all roles: admin, owner, buyer
 *
 * Endpoints:
 *   POST /api/auth/register  - Register owner or buyer (not admin)
 *   POST /api/auth/login     - Login any role
 *   GET  /api/auth/me        - Get current user info
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");

// ─── Validation Rules ────────────────────────────────────────────────────────

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role")
    .optional()
    .isIn(["owner", "buyer"])
    .withMessage(
      "Role must be owner or buyer. Admin accounts are created by the system.",
    ),
  body("phone").optional().trim(),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || null,
  avatarUrl: user.avatarUrl || null,
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Public registration for buyers and owners only.
 * Admin accounts must be created via seed script.
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role = "buyer", phone } = req.body;

    // Prevent public admin registration
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created via registration.",
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, passwordHash, role, phone });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        token: generateToken(user),
        user: safeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Unified login for all roles.
 * Optionally accepts `expectedRole` in body to restrict portal access.
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, expectedRole } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // If the frontend specifies which portal is being used, enforce it
    if (expectedRole && user.role !== expectedRole) {
      const portalNames = { admin: "Admin", owner: "Owner", buyer: "Buyer" };
      return res.status(403).json({
        success: false,
        message: `This account is not registered as ${portalNames[expectedRole] || expectedRole}. Please use the correct portal.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        token: generateToken(user),
        user: safeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's info.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      data: { user: safeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  registerValidation,
  loginValidation,
};
