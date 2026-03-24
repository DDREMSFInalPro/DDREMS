/**
 * Document Routes
 * Routes for uploading and accessing locked ownership documents
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const documentUpload = require('../middleware/documentUpload');
const {
  uploadDocuments,
  getPropertyDocuments,
  downloadDocument,
  deleteDocument,
} = require('../controllers/documentController');

// All document routes require authentication + owner role
router.use(authenticate, roleCheck('owner'));

// POST /api/documents/:propertyId - Upload ownership documents
router.post('/:propertyId', documentUpload.array('documents', 5), uploadDocuments);

// GET /api/documents/:propertyId - List documents for a property
router.get('/:propertyId', getPropertyDocuments);

// GET /api/documents/download/:documentId?key=ACCESS_KEY - Download with key verification
router.get('/download/:documentId', downloadDocument);

// DELETE /api/documents/:documentId - Delete a document
router.delete('/:documentId', deleteDocument);

module.exports = router;
