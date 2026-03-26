/**
 * Dashboard Controller (Buyer Module)
 * Provides summary statistics for the buyer's dashboard
 */
const { Property, Payment, Agreement, SavedProperty } = require('../models');

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

    // Total available properties (published)
    const totalAvailableProperties = await Property.scope(null).count({
      where: { isPublished: true, isDeleted: false },
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
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
