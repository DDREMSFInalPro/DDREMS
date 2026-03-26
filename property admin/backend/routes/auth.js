const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize users collection
db.initializeCollection('users', [
  {
    _id: 'user1',
    email: 'admin@ddrems.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
]);

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = db.findAll('users');
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = uuidv4();
  res.json({
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// Register
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const users = db.findAll('users');
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const newUser = {
    _id: uuidv4(),
    email,
    password,
    name,
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  db.create('users', newUser);
  res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // For simplicity, return a mock user
  res.json({
    _id: 'user1',
    email: 'admin@ddrems.com',
    name: 'Admin User',
    role: 'admin',
  });
});

module.exports = router;
