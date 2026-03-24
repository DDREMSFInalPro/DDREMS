/**
 * Agreement Controller (Buyer Module)
 * Handles agreement request creation and tracking
 */
const { body, validationResult } = require('express-validator');
const { Agreement, Property, User } = require('../models');

/**
 * Validation rules for creating an agreement request
 */
const requestAgreementValidation = [
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('agreementType').isIn(['sale', 'rental']).withMessage('Agreement type must be sale or rental'),
  body('terms').optional().trim(),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('monthlyRent').optional().isFloat({ min: 0 }).withMessage('Monthly rent must be positive'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('Sale price must be positive'),
];

/**
 * Create an agreement request
 * POST /api/agreements
 */
const requestAgreement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const buyerId = req.user.userId;
    const { propertyId, agreementType, terms, startDate, endDate, monthlyRent, salePrice } = req.body;

    // Find published property
    const property = await Property.scope(null).findOne({
      where: { id: propertyId, isPublished: true, isDeleted: false },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not available.',
      });
    }

    // Check for existing pending request
    const existingRequest = await Agreement.findOne({
      where: {
        propertyId,
        buyerId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending agreement request for this property.',
      });
    }

    // Get buyer info for client fields
    const buyer = await User.findByPk(buyerId);

    // Create agreement request
    const agreement = await Agreement.create({
      propertyId,
      ownerId: property.ownerId,
      buyerId,
      clientName: buyer.name,
      clientEmail: buyer.email,
      clientPhone: buyer.phone,
      agreementType,
      status: 'pending',
      terms,
      startDate,
      endDate,
      monthlyRent,
      salePrice,
    });

    // Fetch with associations
    const createdAgreement = await Agreement.findByPk(agreement.id, {
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'propertyType', 'listingType', 'price'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Agreement request submitted successfully. The admin will review it.',
      data: { agreement: createdAgreement },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all agreement requests for the authenticated buyer
 * GET /api/agreements
 */
const getBuyerAgreements = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { buyerId };
    if (status) {
      where.status = status;
    }

    const { count, rows: agreements } = await Agreement.findAndCountAll({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'propertyType', 'listingType', 'price'],
        },
        {
          model: User,
          as: 'ownerUser',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        agreements,
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
 * Get a single agreement by ID
 * GET /api/agreements/:id
 */
const getAgreementById = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { id } = req.params;

    const agreement = await Agreement.findOne({
      where: { id, buyerId },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'propertyType', 'listingType', 'price'],
        },
        {
          model: User,
          as: 'ownerUser',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found.',
      });
    }

    res.json({
      success: true,
      data: { agreement },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestAgreement,
  requestAgreementValidation,
  getBuyerAgreements,
  getAgreementById,
};
