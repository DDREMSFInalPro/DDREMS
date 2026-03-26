const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize renters collection
db.initializeCollection('renters', [
  {
    _id: 'r1',
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: '+251911111111',
    idNumber: 'ID111111',
    budget: 15000,
    preferredType: 'residential',
    preferredLocation: 'Kezira',
    rentalDuration: 'monthly',
    status: 'active',
    registeredDate: new Date().toISOString(),
    currentRentals: [],
    rentalHistory: [],
    paymentHistory: [],
    notes: 'Reliable tenant, always pays on time',
  },
]);

// Get all renters
router.get('/', (req, res) => {
  const renters = db.findAll('renters');
  res.json(renters);
});

// Get renter by ID
router.get('/:id', (req, res) => {
  const renter = db.findById('renters', req.params.id);
  if (!renter) {
    return res.status(404).json({ error: 'Renter not found' });
  }
  res.json(renter);
});

// Create renter
router.post('/', (req, res) => {
  const { name, email, phone, idNumber, budget, preferredType, preferredLocation, rentalDuration, notes } = req.body;

  if (!name || !email || !phone || !idNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newRenter = {
    _id: uuidv4(),
    name,
    email,
    phone,
    idNumber,
    budget: budget || 0,
    preferredType: preferredType || 'residential',
    preferredLocation: preferredLocation || '',
    rentalDuration: rentalDuration || 'monthly',
    status: 'active',
    registeredDate: new Date().toISOString(),
    currentRentals: [],
    rentalHistory: [],
    paymentHistory: [],
    notes: notes || '',
  };

  db.create('renters', newRenter);
  res.status(201).json(newRenter);
});

// Update renter
router.put('/:id', (req, res) => {
  const updated = db.update('renters', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Renter not found' });
  }
  res.json(updated);
});

// Delete renter
router.delete('/:id', (req, res) => {
  db.deleteItem('renters', req.params.id);
  res.json({ message: 'Renter deleted successfully' });
});

// Add current rental to renter
router.post('/:id/rentals', (req, res) => {
  const renter = db.findById('renters', req.params.id);
  if (!renter) {
    return res.status(404).json({ error: 'Renter not found' });
  }

  const rental = req.body;
  renter.currentRentals = renter.currentRentals || [];
  renter.currentRentals.push(rental);

  db.update('renters', req.params.id, renter);
  res.status(201).json(rental);
});

// Add payment to renter
router.post('/:id/payments', (req, res) => {
  const renter = db.findById('renters', req.params.id);
  if (!renter) {
    return res.status(404).json({ error: 'Renter not found' });
  }

  const payment = req.body;
  renter.paymentHistory = renter.paymentHistory || [];
  renter.paymentHistory.unshift(payment);

  db.update('renters', req.params.id, renter);
  res.status(201).json(payment);
});

// Get renters by status
router.get('/status/:status', (req, res) => {
  const renters = db.filter('renters', (r) => r.status === req.params.status);
  res.json(renters);
});

module.exports = router;
