/**
 * SavedProperty Controller (Buyer Module)
 * Handles saving and unsaving favorite properties
 */
const { SavedProperty, Property, PropertyImage, User } = require('../models');

/**
 * Save a property to favorites
 * POST /api/saved/:propertyId
 */
const saveProperty = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { propertyId } = req.params;

    // Verify property exists and is published
    const property = await Property.findOne({
      where: { id: propertyId, isPublished: true },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or not available.',
      });
    }

    // Check if already saved
    const existing = await SavedProperty.findOne({
      where: { buyerId, propertyId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Property already saved.',
      });
    }

    await SavedProperty.create({ buyerId, propertyId });

    res.status(201).json({
      success: true,
      message: 'Property saved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a property from favorites
 * DELETE /api/saved/:propertyId
 */
const unsaveProperty = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { propertyId } = req.params;

    const saved = await SavedProperty.findOne({
      where: { buyerId, propertyId },
    });

    if (!saved) {
      return res.status(404).json({
        success: false,
        message: 'Saved property not found.',
      });
    }

    await saved.destroy();

    res.json({
      success: true,
      message: 'Property removed from saved list.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all saved properties for the authenticated buyer
 * GET /api/saved
 */
const getSavedProperties = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: savedItems } = await SavedProperty.findAndCountAll({
      where: { buyerId },
      include: [
        {
          model: Property,
          as: 'property',
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
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        savedProperties: savedItems,
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
 * Get IDs of all saved properties (for UI toggle state)
 * GET /api/saved/ids
 */
const getSavedPropertyIds = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;

    const saved = await SavedProperty.findAll({
      where: { buyerId },
      attributes: ['propertyId'],
    });

    const ids = saved.map((s) => s.propertyId);

    res.json({
      success: true,
      data: { savedIds: ids },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveProperty,
  unsaveProperty,
  getSavedProperties,
  getSavedPropertyIds,
};
