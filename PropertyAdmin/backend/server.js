/**
 * DDREMS Property Admin Module - Server Entry Point
 */
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5002;

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'agreements'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    console.log('✅ Using existing database schema.');

    app.listen(PORT, () => {
      console.log(`🚀 DDREMS Admin API running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Documentation: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
};

startServer();
