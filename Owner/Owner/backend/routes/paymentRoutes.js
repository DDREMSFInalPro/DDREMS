/**
 * Payment Routes
 * GET /api/payments/owner - List payments received by owner
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getOwnerPayments } = require('../controllers/paymentController');

// All payment routes require authentication + owner role
router.use(authenticate, roleCheck('owner'));

router.get('/owner', getOwnerPayments);

module.exports = router;
