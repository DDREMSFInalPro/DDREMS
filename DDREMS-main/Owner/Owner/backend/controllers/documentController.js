/**
 * Document Controller
 * Handles upload, listing, and key-protected download of ownership documents
 */
const path = require('path');
const fs = require('fs');
const { Property, PropertyDocument } = require('../models');

/**
 * Upload ownership documents for a property
 * POST /api/documents/:propertyId
 */
const uploadDocuments = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { propertyId } = req.params;

    // Verify the property exists and belongs to this owner
    const property = await Property.findOne({ where: { id: propertyId, ownerId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not own this property.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No document files were uploaded.',
      });
    }

    // Create document records with unique access keys
    const documentRecords = req.files.map((file) => ({
      propertyId,
      originalName: file.originalname,
      filePath: `/uploads/documents/${file.filename}`,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      accessKey: PropertyDocument.generateAccessKey(),
      isLocked: true,
      description: 'Ownership Certificate',
    }));

    const createdDocs = await PropertyDocument.bulkCreate(documentRecords);

    res.status(201).json({
      success: true,
      message: `${createdDocs.length} document(s) uploaded successfully.`,
      data: createdDocs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents for a property (owner sees access keys)
 * GET /api/documents/:propertyId
 */
const getPropertyDocuments = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { propertyId } = req.params;

    // Verify ownership
    const property = await Property.findOne({ where: { id: propertyId, ownerId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not own this property.',
      });
    }

    const documents = await PropertyDocument.findAll({
      where: { propertyId },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a document — requires the correct access key
 * GET /api/documents/download/:documentId?key=ACCESS_KEY
 */
const downloadDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Access key is required to download this document.',
      });
    }

    const document = await PropertyDocument.findByPk(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // Verify access key
    if (document.accessKey !== key) {
      return res.status(403).json({
        success: false,
        message: '🔒 Access denied. Invalid document key.',
      });
    }

    // Stream the file
    const filePath = path.join(__dirname, '..', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server.',
      });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document (owner only)
 * DELETE /api/documents/:documentId
 */
const deleteDocument = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { documentId } = req.params;

    const document = await PropertyDocument.findByPk(documentId, {
      include: [{ model: Property, as: 'property', attributes: ['id', 'ownerId'] }],
    });

    if (!document || document.property.ownerId !== ownerId) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or you do not own this document.',
      });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocuments,
  getPropertyDocuments,
  downloadDocument,
  deleteDocument,
};
