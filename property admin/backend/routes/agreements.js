const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize agreements collection
db.initializeCollection('agreements', [
  {
    _id: 'ag1',
    type: 'sale',
    propertyId: 'p1',
    propertyName: 'Luxury Villa in Kezira',
    buyerId: 'b1',
    buyerName: 'Ahmed Mohammed',
    ownerId: 'o1',
    ownerName: 'Sara Tesfaye',
    price: 8500000,
    status: 'active',
    createdDate: new Date().toISOString(),
  },
  {
    _id: 'ag2',
    type: 'rental',
    propertyId: 'p4',
    propertyName: 'Modern Apartment',
    renterId: 'r1',
    renterName: 'Mohammed Ali',
    ownerId: 'o2',
    ownerName: 'Bekele Alemu',
    monthlyRent: 15000,
    duration: '12 months',
    status: 'active',
    createdDate: new Date().toISOString(),
  },
]);

// Get all agreements
router.get('/', (req, res) => {
  try {
    const agreements = db.findAll('agreements');
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single agreement
router.get('/:id', (req, res) => {
  try {
    const agreement = db.findById('agreements', req.params.id);
    if (!agreement) {
      return res.status(404).json({ error: 'Agreement not found' });
    }
    res.json(agreement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new agreement
router.post('/', (req, res) => {
  try {
    const newAgreement = {
      _id: uuidv4(),
      ...req.body,
      status: 'active',
      createdDate: new Date().toISOString(),
    };
    
    db.create('agreements', newAgreement);
    res.status(201).json(newAgreement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update agreement
router.put('/:id', (req, res) => {
  try {
    const updated = db.update('agreements', req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete agreement
router.delete('/:id', (req, res) => {
  try {
    db.deleteItem('agreements', req.params.id);
    res.json({ message: 'Agreement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
