/**
 * Profile Controller (Buyer Module)
 * Handles buyer profile viewing and updating
 */
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('bio').optional().trim(),
  body('currentPassword').optional(),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

/**
 * Get authenticated user's profile
 * GET /api/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user's profile
 * PUT /api/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.userId;
    const { name, phone, address, bio, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update basic fields
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;

    // Handle password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await user.update(updateData);

    // Return updated profile without password
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfileValidation,
};
