/**
 * Payment Routes
 * GET /api/payments/owner - List payments received by owner
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getOwnerPayments, getPaymentByAgreement } = require('../controllers/paymentController');

router.use(authenticate, roleCheck('owner'));

router.get('/owner', getOwnerPayments);
router.get('/agreement/:agreementId', getPaymentByAgreement);

module.exports = router;
