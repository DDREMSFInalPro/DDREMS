/**
 * Profile Controller (Admin Module)
 */
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
];

/**
 * GET /api/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { name, phone, address, bio, currentPassword, newPassword } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      user.avatarUrl = `/uploads/${req.file.filename}`;
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    const updated = user.toJSON();
    delete updated.passwordHash;
    res.json({ success: true, message: 'Profile updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, updateProfileValidation };
