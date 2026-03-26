/**
 * Route Aggregator
 */
const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/dashboard", require("./dashboardRoutes"));
router.use("/properties", require("./propertyRoutes"));
router.use("/saved", require("./savedRoutes"));
router.use("/agreements", require("./agreementRoutes"));
router.use("/profile", require("./profileRoutes"));
router.use("/payments", require("./paymentRoutes"));
router.use("/users", require("./userRoutes"));

module.exports = router;
