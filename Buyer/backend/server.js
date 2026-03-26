/**
 * DDREMS Buyer Module - Server Entry Point
 * Initializes database connection and starts Express server
 */
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5001;

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Schema already created via schema.sql — no need for Sequelize sync
    console.log('✅ Using existing database schema.');

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 DDREMS Buyer API running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Documentation: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();
