/**
 * Property Routes — Unified
 *
 * GET    /api/properties              - List (buyer=published, owner=own, admin=all)
 * GET    /api/properties/:id          - Get single property
 * POST   /api/properties              - Create (owner only)
 * PUT    /api/properties/:id          - Update (owner only)
 * DELETE /api/properties/:id          - Soft-delete (owner only)
 * PATCH  /api/properties/:id/publish  - Toggle publish (owner/admin)
 * DELETE /api/properties/:id/images/:imageId - Delete image (owner only)
 *
 * GET    /api/saved                   - Buyer saved list
 * GET    /api/saved/ids               - Buyer saved IDs
 * POST   /api/saved/:propertyId       - Save property (buyer)
 * DELETE /api/saved/:propertyId       - Unsave property (buyer)
 */
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const upload = require("../middleware/upload");
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  togglePublish,
  deletePropertyImage,
  addPropertyValidation,
  updatePropertyValidation,
} = require("../controllers/propertyController");

// All property routes require authentication
router.use(authenticate);

// ── Read (all roles) ──────────────────────────────────────────────────────────
router.get("/", getProperties);
router.get("/:id", getPropertyById);

// ── Write (owner only) ────────────────────────────────────────────────────────
router.post(
  "/",
  roleCheck("owner"),
  upload.array("images", 20),
  addPropertyValidation,
  createProperty,
);
router.put(
  "/:id",
  roleCheck("owner"),
  upload.array("images", 20),
  updatePropertyValidation,
  updateProperty,
);
router.delete("/:id", roleCheck("owner"), deleteProperty);
router.delete("/:id/images/:imageId", roleCheck("owner"), deletePropertyImage);

// ── Publish toggle (owner or admin) ──────────────────────────────────────────
router.patch("/:id/publish", roleCheck("owner", "admin"), togglePublish);

module.exports = router;
