const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getPayments, getCommissionStats, getWithdrawals, updateWithdrawal } = require('../controllers/paymentController');

router.use(authenticate, roleCheck('admin'));

router.get('/',                    getPayments);
router.get('/commission',          getCommissionStats);
router.get('/withdrawals',         getWithdrawals);
router.patch('/withdrawals/:id',   updateWithdrawal);

module.exports = router;
