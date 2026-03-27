/**
 * Payment Routes (Buyer Module)
 * GET /api/payments - List payments made by buyer
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getBuyerPayments, submitPayment, getPaymentByAgreement } = require('../controllers/paymentController');
const upload = require('../middleware/upload');

router.use(authenticate, roleCheck('buyer'));

router.get('/', getBuyerPayments);
router.post('/submit', upload.single('receipt'), submitPayment);
router.get('/agreement/:agreementId', getPaymentByAgreement);

module.exports = router;
