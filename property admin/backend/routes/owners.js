const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize owners collection
db.initializeCollection('owners', [
  {
    _id: 'o1',
    name: 'Yohannes Assefa',
    email: 'yohannes@example.com',
    phone: '+251944567890',
    idNumber: 'ID456789',
    address: 'Kezira, Dire Dawa',
    status: 'verified',
    registeredDate: new Date().toISOString(),
    properties: [],
    documents: [],
  },
  {
    _id: 'o2',
    name: 'Marta Kebede',
    email: 'marta@example.com',
    phone: '+251955678901',
    idNumber: 'ID567890',
    address: 'City Center, Dire Dawa',
    status: 'pending',
    registeredDate: new Date().toISOString(),
    properties: [],
    documents: [],
  },
]);

// Get all owners
router.get('/', (req, res) => {
  const owners = db.findAll('owners');
  res.json(owners);
});

// Get owner by ID
router.get('/:id', (req, res) => {
  const owner = db.findById('owners', req.params.id);
  if (!owner) {
    return res.status(404).json({ error: 'Owner not found' });
  }
  res.json(owner);
});

// Create owner
router.post('/', (req, res) => {
  const { name, email, phone, idNumber, address } = req.body;

  if (!name || !email || !phone || !idNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newOwner = {
    _id: uuidv4(),
    name,
    email,
    phone,
    idNumber,
    address: address || '',
    status: 'pending',
    registeredDate: new Date().toISOString(),
    properties: [],
    documents: [],
  };

  db.create('owners', newOwner);
  res.status(201).json(newOwner);
});

// Update owner
router.put('/:id', (req, res) => {
  const updated = db.update('owners', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Owner not found' });
  }
  res.json(updated);
});

// Delete owner
router.delete('/:id', (req, res) => {
  db.deleteItem('owners', req.params.id);
  res.json({ message: 'Owner deleted successfully' });
});

// Add property to owner
router.post('/:id/properties', (req, res) => {
  const owner = db.findById('owners', req.params.id);
  if (!owner) {
    return res.status(404).json({ error: 'Owner not found' });
  }

  const property = req.body;
  owner.properties = owner.properties || [];
  owner.properties.push(property);

  db.update('owners', req.params.id, owner);
  res.status(201).json(property);
});

// Add document to owner
router.post('/:id/documents', (req, res) => {
  const owner = db.findById('owners', req.params.id);
  if (!owner) {
    return res.status(404).json({ error: 'Owner not found' });
  }

  const document = req.body;
  owner.documents = owner.documents || [];
  owner.documents.push(document);

  db.update('owners', req.params.id, owner);
  res.status(201).json(document);
});

module.exports = router;
