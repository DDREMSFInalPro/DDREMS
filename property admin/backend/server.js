const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');
const buyersRoutes = require('./routes/buyers');
const rentersRoutes = require('./routes/renters');
const ownersRoutes = require('./routes/owners');
const requestsRoutes = require('./routes/requests');
const agreementsRoutes = require('./routes/agreements');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/renters', rentersRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/agreements', agreementsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
