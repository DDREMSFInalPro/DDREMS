const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getPayments } = require('../controllers/paymentController');

router.use(authenticate, roleCheck('admin'));
router.get('/', getPayments);

module.exports = router;
