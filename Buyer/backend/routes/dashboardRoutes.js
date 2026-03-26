/**
 * Dashboard Routes (Buyer Module)
 * GET /api/dashboard - Buyer dashboard summary
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getDashboard } = require('../controllers/dashboardController');

// Dashboard requires authentication + buyer role
router.use(authenticate, roleCheck('buyer'));

router.get('/', getDashboard);

module.exports = router;
