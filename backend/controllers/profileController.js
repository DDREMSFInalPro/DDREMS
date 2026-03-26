/**
 * Profile Controller — Unified
 * Works for all roles: admin, owner, buyer
 *
 * GET /api/profile      - Get own profile
 * PUT /api/profile      - Update profile (name, phone, address, bio, avatar, password)
 */
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");

// ─── Validation ───────────────────────────────────────────────────────────────

const updateProfileValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().trim(),
  body("address").optional().trim(),
  body("bio").optional().trim(),
  body("currentPassword").optional(),
  body("newPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ["passwordHash"] },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Supports multipart/form-data for avatar upload
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const { name, phone, address, bio, currentPassword, newPassword } =
      req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;

    // Avatar upload
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }

    // Password change — requires current password verification
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password.",
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.update(updateData);

    const updated = await User.findByPk(req.user.userId, {
      attributes: { exclude: ["passwordHash"] },
    });

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, updateProfileValidation };
