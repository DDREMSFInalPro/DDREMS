/**
 * Dashboard Routes
 * GET /api/dashboard - Owner dashboard summary
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getDashboard } = require('../controllers/dashboardController');

// Dashboard requires authentication + owner role
router.use(authenticate, roleCheck('owner'));

router.get('/', getDashboard);

module.exports = router;
