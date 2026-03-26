const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize properties collection
db.initializeCollection('properties', [
  {
    _id: 'p1',
    title: 'Modern Villa in Kezira',
    type: 'residential',
    price: 2500000,
    address: 'Kezira, Dire Dawa',
    bedrooms: 4,
    bathrooms: 3,
    size: 250,
    status: 'approved',
    ownerId: 'o1',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'p2',
    title: 'Commercial Space Downtown',
    type: 'commercial',
    price: 1800000,
    address: 'City Center, Dire Dawa',
    bedrooms: 0,
    bathrooms: 2,
    size: 150,
    status: 'pending',
    ownerId: 'o2',
    createdAt: new Date().toISOString(),
  },
]);

// Get all properties
router.get('/', (req, res) => {
  const properties = db.findAll('properties');
  res.json(properties);
});

// Get property by ID
router.get('/:id', (req, res) => {
  const property = db.findById('properties', req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.json(property);
});

// Create property
router.post('/', (req, res) => {
  const { title, type, price, address, bedrooms, bathrooms, size, ownerId } = req.body;

  if (!title || !type || !price || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newProperty = {
    _id: uuidv4(),
    title,
    type,
    price,
    address,
    bedrooms: bedrooms || 0,
    bathrooms: bathrooms || 0,
    size: size || 0,
    status: 'pending',
    ownerId,
    createdAt: new Date().toISOString(),
  };

  db.create('properties', newProperty);
  res.status(201).json(newProperty);
});

// Update property
router.put('/:id', (req, res) => {
  const updated = db.update('properties', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.json(updated);
});

// Delete property
router.delete('/:id', (req, res) => {
  db.deleteItem('properties', req.params.id);
  res.json({ message: 'Property deleted successfully' });
});

// Get properties by owner
router.get('/owner/:ownerId', (req, res) => {
  const properties = db.filter('properties', (p) => p.ownerId === req.params.ownerId);
  res.json(properties);
});

module.exports = router;
