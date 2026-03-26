/**
 * Property Controller (Buyer Module)
 * Handles browsing published properties
 */
const { Property, PropertyImage, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Browse all published properties
 * GET /api/properties
 */
const browseProperties = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      bedrooms,
      city,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build filter conditions — only published properties
    const where = {
      isPublished: true,
      isDeleted: false,
    };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (city) where.city = { [Op.iLike]: `%${city}%` };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    if (bedrooms) {
      where.bedrooms = { [Op.gte]: parseInt(bedrooms) };
    }

    // Valid sort fields
    const allowedSortFields = ['createdAt', 'price', 'sizeSqm', 'bedrooms'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: properties } = await Property.scope(null).findAndCountAll({
      where,
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      order: [[orderField, orderDir]],
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
 * Get a single property by ID (public — must be published)
 * GET /api/properties/:id
 */
const getPropertyDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await Property.scope(null).findOne({
      where: { id, isPublished: true, isDeleted: false },
      include: [
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'isPrimary', 'sortOrder'],
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

module.exports = {
  browseProperties,
  getPropertyDetail,
};
