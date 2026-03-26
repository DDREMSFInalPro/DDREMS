/**
 * Agreement Routes (Owner Module)
 * GET    /api/agreements              - List all agreement requests & agreements
 * GET    /api/agreements/:id          - Get single agreement details
 * PATCH  /api/agreements/:id/respond  - Owner approves or rejects a request
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getOwnerAgreements,
  respondToRequest,
  respondToRequestValidation,
  getAgreementById,
} = require('../controllers/agreementController');

// All agreement routes require authentication + owner role
router.use(authenticate, roleCheck('owner'));

router.get('/', getOwnerAgreements);
router.get('/:id', getAgreementById);
router.patch('/:id/respond', respondToRequestValidation, respondToRequest);

module.exports = router;
