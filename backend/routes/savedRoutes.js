/**
 * Saved Properties Routes (Buyer only)
 *
 * GET    /api/saved              - List saved properties
 * GET    /api/saved/ids          - Get saved property IDs
 * POST   /api/saved/:propertyId  - Save a property
 * DELETE /api/saved/:propertyId  - Unsave a property
 */
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const {
  getSavedProperties,
  getSavedPropertyIds,
  saveProperty,
  unsaveProperty,
} = require("../controllers/propertyController");

router.use(authenticate, roleCheck("buyer"));

router.get("/", getSavedProperties);
router.get("/ids", getSavedPropertyIds);
router.post("/:propertyId", saveProperty);
router.delete("/:propertyId", unsaveProperty);

module.exports = router;
