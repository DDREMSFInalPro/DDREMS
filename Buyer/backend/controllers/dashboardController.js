/**
 * Dashboard Controller (Buyer Module)
 * Provides summary statistics for the buyer's dashboard
 */
const { Property, Payment, Agreement, SavedProperty, PropertyImage } = require('../models');

/**
 * Get dashboard summary for the authenticated buyer
 * GET /api/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;

    // Total saved properties
    const totalSaved = await SavedProperty.count({
      where: { buyerId },
    });

    // Agreement requests by status
    const totalAgreements = await Agreement.count({
      where: { buyerId },
    });

    const pendingAgreements = await Agreement.count({
      where: { buyerId, status: 'pending' },
    });

    const approvedAgreements = await Agreement.count({
      where: { buyerId, status: 'owner_approved' },
    });

    const completedAgreements = await Agreement.count({
      where: { buyerId, status: 'completed' },
    });

    // Total payments made
    const totalPayments = await Payment.count({
      where: { payerId: buyerId },
    });

    // Total available properties (published, not deleted)
    const totalAvailableProperties = await Property.count({
      where: { isPublished: true },
    });

    // Recent agreement requests (last 5)
    const recentAgreements = await Agreement.findAll({
      where: { buyerId },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'price', 'propertyType'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Recent saved properties (last 4)
    const recentSaved = await SavedProperty.findAll({
      where: { buyerId },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'price', 'propertyType', 'listingType', 'address'],
          include: [{ model: PropertyImage, as: 'images', attributes: ['imageUrl', 'isPrimary'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 4,
    });

    // Recent payments (last 5)
    const recentPayments = await Payment.findAll({
      where: { payerId: buyerId },
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalSaved,
          totalAgreements,
          pendingAgreements,
          approvedAgreements,
          completedAgreements,
          totalPayments,
          totalAvailableProperties,
        },
        recentAgreements,
        recentSaved,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
