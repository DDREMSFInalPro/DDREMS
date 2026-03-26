const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getDashboard } = require('../controllers/dashboardController');

router.use(authenticate, roleCheck('admin'));
router.get('/', getDashboard);

module.exports = router;
