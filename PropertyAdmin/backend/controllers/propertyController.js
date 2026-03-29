/**
 * Property Management Controller (Admin Module)
 * List all properties, view details, toggle publish status
 */
const { Op } = require('sequelize');
const { Property, PropertyImage, User } = require('../models');

/**
 * GET /api/properties
 * List all properties with filters
 */
const getProperties = async (req, res, next) => {
  try {
    const {
      search, propertyType, listingType, status, isPublished,
      sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 20,
    } = req.query;

    const where = {};
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (status) where.status = status;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [
        { model: PropertyImage, as: 'images', attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        properties: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/properties/:id
 */
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        { model: PropertyImage, as: 'images', attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
      ],
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/properties/:id/toggle-publish
 * Admin can publish/unpublish any property
 */
const togglePublish = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    const newPublished = !property.isPublished;
    await property.update({
      isPublished: newPublished,
      status: newPublished ? 'active' : 'draft',
    });

    res.json({
      success: true,
      message: `Property ${newPublished ? 'approved & published' : 'unpublished'} successfully.`,
      data: { id: property.id, isPublished: newPublished, status: newPublished ? 'active' : 'draft' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProperties, getPropertyById, togglePublish };
