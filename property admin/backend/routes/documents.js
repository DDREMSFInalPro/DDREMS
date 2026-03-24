const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/fileDb');

// Initialize documents collection
db.initializeCollection('documents', []);

// Get all documents
router.get('/', (req, res) => {
  const documents = db.findAll('documents');
  res.json(documents);
});

// Get document by ID
router.get('/:id', (req, res) => {
  const document = db.findById('documents', req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
});

// Create document
router.post('/', (req, res) => {
  const { name, type, ownerId, propertyId, status } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newDocument = {
    _id: uuidv4(),
    name,
    type,
    ownerId: ownerId || null,
    propertyId: propertyId || null,
    status: status || 'pending',
    uploadDate: new Date().toISOString(),
    url: '#',
  };

  db.create('documents', newDocument);
  res.status(201).json(newDocument);
});

// Update document
router.put('/:id', (req, res) => {
  const updated = db.update('documents', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(updated);
});

// Delete document
router.delete('/:id', (req, res) => {
  db.deleteItem('documents', req.params.id);
  res.json({ message: 'Document deleted successfully' });
});

// Get documents by owner
router.get('/owner/:ownerId', (req, res) => {
  const documents = db.filter('documents', (d) => d.ownerId === req.params.ownerId);
  res.json(documents);
});

// Get documents by property
router.get('/property/:propertyId', (req, res) => {
  const documents = db.filter('documents', (d) => d.propertyId === req.params.propertyId);
  res.json(documents);
});

// Get documents by status
router.get('/status/:status', (req, res) => {
  const documents = db.filter('documents', (d) => d.status === req.params.status);
  res.json(documents);
});

module.exports = router;
