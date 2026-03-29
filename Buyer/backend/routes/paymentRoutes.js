const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const { getBuyerPayments, submitPayment, getPaymentByAgreement, initializeChapaPayment, verifyChapaReturn, chapaWebhook } = require('../controllers/paymentController');

// Chapa webhook — no auth (called by Chapa servers)
router.post('/chapa/webhook', chapaWebhook);

// All other routes require buyer auth
router.use(authenticate, roleCheck('buyer'));

router.get('/', getBuyerPayments);
router.post('/chapa/initialize', initializeChapaPayment);
router.get('/chapa/verify/:txRef', verifyChapaReturn);
router.post('/submit', upload.single('receipt'), submitPayment);
router.get('/agreement/:agreementId', getPaymentByAgreement);

module.exports = router;
