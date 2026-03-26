/**
 * Saved Property Routes (Buyer Module)
 * POST   /api/saved/:propertyId  - Save a property
 * DELETE /api/saved/:propertyId  - Unsave a property
 * GET    /api/saved              - List saved properties
 * GET    /api/saved/ids          - Get saved property IDs
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  saveProperty,
  unsaveProperty,
  getSavedProperties,
  getSavedPropertyIds,
} = require('../controllers/savedPropertyController');

// All saved property routes require authentication + buyer role
router.use(authenticate, roleCheck('buyer'));

router.get('/', getSavedProperties);
router.get('/ids', getSavedPropertyIds);
router.post('/:propertyId', saveProperty);
router.delete('/:propertyId', unsaveProperty);

module.exports = router;
