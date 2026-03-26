/**
 * Payment Routes — Unified (all roles)
 *
 * GET /api/payments  - List payments (role-filtered)
 */
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { getPayments } = require("../controllers/paymentController");

router.use(authenticate);
router.get("/", getPayments);

module.exports = router;
