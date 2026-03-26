/**
 * Profile Routes — Unified (all roles)
 *
 * GET /api/profile  - Get own profile
 * PUT /api/profile  - Update profile (supports avatar upload via multipart/form-data)
 */
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  updateProfileValidation,
} = require("../controllers/profileController");

router.use(authenticate);

router.get("/", getProfile);
router.put(
  "/",
  upload.single("avatar"),
  updateProfileValidation,
  updateProfile,
);

module.exports = router;
