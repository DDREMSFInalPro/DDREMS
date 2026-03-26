/**
 * Payment Routes (Buyer Module)
 * GET /api/payments - List payments made by buyer
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getBuyerPayments } = require('../controllers/paymentController');

// All payment routes require authentication + buyer role
router.use(authenticate, roleCheck('buyer'));

router.get('/', getBuyerPayments);

module.exports = router;
