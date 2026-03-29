const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getWallet, getTransactions, requestWithdrawal, getWithdrawals } = require('../controllers/walletController');

router.use(authenticate, roleCheck('owner'));

router.get('/',              getWallet);
router.get('/transactions',  getTransactions);
router.post('/withdraw',     requestWithdrawal);
router.get('/withdrawals',   getWithdrawals);

module.exports = router;
