/**
 * Express Application Setup (Buyer Module)
 * Configures middleware, routes, and error handling
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// Import routes
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const agreementRoutes = require("./routes/agreementRoutes");
const savedRoutes = require("./routes/savedRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ==========================================
// Global Middleware
// ==========================================

// CORS - allow frontend requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    credentials: true,
  }),
);

// Request logging
app.use(morgan("dev"));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (own + cross-module)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Cross-module: serve Owner's uploads (property images)
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", "..", "Owner", "Owner", "backend", "uploads"),
  ),
);
// Cross-module: serve Admin's uploads (agreement PDFs)
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", "..", "PropertyAdmin", "backend", "uploads"),
  ),
);

// ==========================================
// API Routes
// ==========================================

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/properties", propertyRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/formal-agreements", require("./routes/formalAgreementRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DDREMS Buyer API is running.",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
