/**
 * Property Routes
 * All routes require authentication and owner role
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const {
  getOwnerProperties,
  getProperty,
  addProperty,
  updateProperty,
  deleteProperty,
  togglePublish,
  getAIPrice,
  addPropertyValidation,
  updatePropertyValidation,
} = require('../controllers/propertyController');

// All property routes require authentication + owner role
router.use(authenticate, roleCheck('owner'));

// GET /api/properties/owner - List owner's properties
router.get('/owner', getOwnerProperties);

// GET /api/properties/:id - Get single property
router.get('/:id', getProperty);

// POST /api/properties - Add new property (with image upload)
router.post('/', upload.array('images', 20), addPropertyValidation, addProperty);

// PUT /api/properties/:id - Update property (with optional image upload)
router.put('/:id', upload.array('images', 20), updatePropertyValidation, updateProperty);

// DELETE /api/properties/:id - Soft-delete property
router.delete('/:id', deleteProperty);

// POST /api/properties/:id/publish - Toggle publish status
router.post('/:id/publish', togglePublish);

module.exports = router;
