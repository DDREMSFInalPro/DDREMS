/**
 * Profile Routes (Buyer Module)
 * GET  /api/profile - Get user profile
 * PUT  /api/profile - Update user profile
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  updateProfileValidation,
} = require('../controllers/profileController');

// Profile routes require authentication (any role)
router.use(authenticate);

router.get('/', getProfile);
router.put('/', upload.single('avatar'), updateProfileValidation, updateProfile);

module.exports = router;
