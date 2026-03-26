/**
 * DDREMS Unified Server
 * Single server handling all roles: Admin, Owner, Buyer
 */
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { testConnection } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DDREMS Unified API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(
        `\n🚀 DDREMS Unified Server running on http://localhost:${PORT}`,
      );
      console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
