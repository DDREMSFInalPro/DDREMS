/**
 * Express Application Setup (Property Admin Module)
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5175',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded files statically (own + cross-module)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Cross-module: serve Owner's uploads (property images)
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'Owner', 'Owner', 'backend', 'uploads')));
// Cross-module: serve Buyer's uploads (avatars)
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'Buyer', 'backend', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DDREMS Admin API is running.', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Error handler
app.use(errorHandler);

module.exports = app;
