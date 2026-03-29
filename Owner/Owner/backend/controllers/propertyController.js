/**
 * Property Controller
 * Handles CRUD operations for owner's properties
 */
const { body, param, query, validationResult } = require('express-validator');
const { Property, PropertyImage, User } = require('../models');
const { getPriceRecommendation } = require('../services/aiService');
const { Op } = require('sequelize');

/**
 * Validation rules for creating a property
 */
const addPropertyValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('description').optional().trim(),
  body('propertyType').isIn(['apartment', 'house', 'villa', 'commercial', 'land', 'office'])
    .withMessage('Invalid property type'),
  body('listingType').isIn(['sale', 'rent']).withMessage('Listing type must be sale or rent'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sizeSqm').optional().isFloat({ min: 0 }).withMessage('Size must be a positive number'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').optional().trim(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('tourUrl3d').optional().isURL().withMessage('3D tour must be a valid URL'),
  body('amenities').optional().isArray(),
];

/**
 * Validation rules for updating a property
 */
const updatePropertyValidation = [
  param('id').isUUID().withMessage('Invalid property ID'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('propertyType').optional().isIn(['apartment', 'house', 'villa', 'commercial', 'land', 'office']),
  body('listingType').optional().isIn(['sale', 'rent']),
  body('price').optional().isFloat({ min: 0 }),
  body('sizeSqm').optional().isFloat({ min: 0 }),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isInt({ min: 0 }),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('tourUrl3d').optional().isURL(),
  body('amenities').optional().isArray(),
];

/**
 * Get all properties for the authenticated owner
 * GET /api/properties/owner
 */
const getOwnerProperties = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      propertyType,
      listingType,
      isPublished,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = { ownerId };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) where.status = status;
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    const { count, rows: properties } = await Property.findAndCountAll({
      where,
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single property by ID (owner must own it)
 * GET /api/properties/:id
 */
const getProperty = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const property = await Property.findOne({
      where: { id, ownerId },
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder'],
          order: [['sortOrder', 'ASC']],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.',
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new property
 * POST /api/properties
 */
const addProperty = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const ownerId = req.user.userId;
    const {
      title, description, propertyType, listingType, price,
      sizeSqm, bedrooms, bathrooms, address, city,
      latitude, longitude, tourUrl3d, amenities,
    } = req.body;

    // Create property
    const property = await Property.create({
      ownerId,
      title,
      description,
      propertyType,
      listingType,
      price,
      sizeSqm,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      address,
      city: city || 'Dire Dawa',
      latitude,
      longitude,
      tourUrl3d,
      amenities: amenities || [],
      status: 'draft',
    });

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const imageRecords = req.files.map((file, index) => ({
        propertyId: property.id,
        imageUrl: `/uploads/${file.filename}`,
        isPrimary: index === 0,
        sortOrder: index,
      }));
      await PropertyImage.bulkCreate(imageRecords);
    }

    // Fetch the created property with images
    const createdProperty = await Property.findByPk(property.id, {
      include: [{ model: PropertyImage, as: 'images' }],
    });

    res.status(201).json({
      success: true,
      message: 'Property added successfully.',
      data: createdProperty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing property
 * PUT /api/properties/:id
 */
const updateProperty = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const ownerId = req.user.userId;
    const { id } = req.params;

    // Find property and verify ownership
    const property = await Property.findOne({ where: { id, ownerId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not own this property.',
      });
    }

    // Update fields
    const updateData = {};
    const allowedFields = [
      'title', 'description', 'propertyType', 'listingType', 'price',
      'sizeSqm', 'bedrooms', 'bathrooms', 'address', 'city',
      'latitude', 'longitude', 'tourUrl3d', 'amenities', 'status',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await property.update(updateData);

    // Handle new uploaded images (append to existing)
    if (req.files && req.files.length > 0) {
      const existingCount = await PropertyImage.count({ where: { propertyId: id } });
      const imageRecords = req.files.map((file, index) => ({
        propertyId: id,
        imageUrl: `/uploads/${file.filename}`,
        isPrimary: existingCount === 0 && index === 0,
        sortOrder: existingCount + index,
      }));
      await PropertyImage.bulkCreate(imageRecords);
    }

    // Fetch updated property
    const updatedProperty = await Property.findByPk(id, {
      include: [{ model: PropertyImage, as: 'images' }],
    });

    res.json({
      success: true,
      message: 'Property updated successfully.',
      data: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete a property
 * DELETE /api/properties/:id
 */
const deleteProperty = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const property = await Property.findOne({ where: { id, ownerId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not own this property.',
      });
    }

    // Soft delete: set is_deleted to true and unpublish
    await property.update({
      isDeleted: true,
      isPublished: false,
      status: 'withdrawn',
    });

    res.json({
      success: true,
      message: 'Property deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle publish/unpublish status of a property
 * POST /api/properties/:id/publish
 */
const togglePublish = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const property = await Property.findOne({ where: { id, ownerId } });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or you do not own this property.',
      });
    }

    if (['sold', 'rented'].includes(property.status)) {
      return res.status(400).json({
        success: false,
        message: `This property has been ${property.status} and can no longer be published.`,
      });
    }

    const newPublished = !property.isPublished;

    // Owner publishing sends for admin approval, not directly live
    if (newPublished) {
      await property.update({ status: 'pending_approval', isPublished: false });
      return res.json({
        success: true,
        message: 'Property submitted for admin approval. It will be visible to buyers once approved.',
        data: { id: property.id, isPublished: false, status: 'pending_approval' },
      });
    }

    // Unpublish
    await property.update({ isPublished: false, status: 'draft' });
    res.json({
      success: true,
      message: 'Property unpublished.',
      data: { id: property.id, isPublished: false, status: 'draft' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI price recommendation
 * GET /api/price-recommendation
 */
const getAIPrice = async (req, res, next) => {
  try {
    const { propertyType, listingType, sizeSqm, bedrooms, bathrooms, city, address } = req.query;

    if (!propertyType || !listingType || !sizeSqm) {
      return res.status(400).json({
        success: false,
        message: 'propertyType, listingType, and sizeSqm are required.',
      });
    }

    const recommendation = await getPriceRecommendation({
      propertyType,
      listingType,
      sizeSqm: parseFloat(sizeSqm),
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      city: city || 'Dire Dawa',
      address: address || '',
    });

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnerProperties,
  getProperty,
  addProperty,
  updateProperty,
  deleteProperty,
  togglePublish,
  getAIPrice,
  addPropertyValidation,
  updatePropertyValidation,
};
