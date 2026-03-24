const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize buyers collection
db.initializeCollection('buyers', [
  {
    _id: 'b1',
    name: 'Ahmed Hassan',
    email: 'ahmed@example.com',
    phone: '+251911234567',
    idNumber: 'ID123456',
    budget: 3000000,
    preferredType: 'residential',
    preferredLocation: 'Kezira',
    status: 'active',
    registeredDate: new Date().toISOString(),
  },
  {
    _id: 'b2',
    name: 'Fatima Mohamed',
    email: 'fatima@example.com',
    phone: '+251922345678',
    idNumber: 'ID234567',
    budget: 2000000,
    preferredType: 'commercial',
    preferredLocation: 'City Center',
    status: 'active',
    registeredDate: new Date().toISOString(),
  },
]);

// Get all buyers
router.get('/', (req, res) => {
  const buyers = db.findAll('buyers');
  res.json(buyers);
});

// Get buyer by ID
router.get('/:id', (req, res) => {
  const buyer = db.findById('buyers', req.params.id);
  if (!buyer) {
    return res.status(404).json({ error: 'Buyer not found' });
  }
  res.json(buyer);
});

// Create buyer
router.post('/', (req, res) => {
  const { name, email, phone, idNumber, budget, preferredType, preferredLocation } = req.body;

  if (!name || !email || !phone || !idNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newBuyer = {
    _id: uuidv4(),
    name,
    email,
    phone,
    idNumber,
    budget: budget || 0,
    preferredType: preferredType || 'residential',
    preferredLocation: preferredLocation || '',
    status: 'active',
    registeredDate: new Date().toISOString(),
  };

  db.create('buyers', newBuyer);
  res.status(201).json(newBuyer);
});

// Update buyer
router.put('/:id', (req, res) => {
  const updated = db.update('buyers', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Buyer not found' });
  }
  res.json(updated);
});

// Delete buyer
router.delete('/:id', (req, res) => {
  db.deleteItem('buyers', req.params.id);
  res.json({ message: 'Buyer deleted successfully' });
});

module.exports = router;
