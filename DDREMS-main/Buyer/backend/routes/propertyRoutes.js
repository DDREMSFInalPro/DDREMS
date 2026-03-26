/**
 * Property Routes (Buyer Module)
 * GET /api/properties       - Browse published properties
 * GET /api/properties/:id   - Get property details
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { browseProperties, getPropertyDetail } = require('../controllers/propertyController');

// Property browsing requires authentication (any role can browse)
router.use(authenticate);

router.get('/', browseProperties);
router.get('/:id', getPropertyDetail);

module.exports = router;
