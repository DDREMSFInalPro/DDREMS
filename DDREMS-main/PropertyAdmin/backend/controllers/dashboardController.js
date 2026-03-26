/**
 * Dashboard Controller (Admin Module)
 * System-wide statistics for the admin dashboard
 */
const { Op } = require('sequelize');
const { User, Property, Agreement, Payment } = require('../models');

/**
 * GET /api/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    // User counts
    const totalUsers = await User.count();
    const totalOwners = await User.count({ where: { role: 'owner' } });
    const totalBuyers = await User.count({ where: { role: 'buyer' } });

    // Property counts
    const totalProperties = await Property.count();
    const publishedProperties = await Property.count({ where: { isPublished: true } });
    const draftProperties = await Property.count({ where: { status: 'draft' } });

    // Agreement counts
    const totalAgreements = await Agreement.count();
    const pendingAgreements = await Agreement.count({ where: { status: 'pending' } });
    const approvedAgreements = await Agreement.count({ where: { status: 'owner_approved' } });
    const rejectedAgreements = await Agreement.count({ where: { status: 'owner_rejected' } });
    const completedAgreements = await Agreement.count({ where: { status: 'completed' } });

    // Payment stats
    const totalPayments = await Payment.count();
    const totalRevenue = await Payment.sum('amount', { where: { paymentStatus: 'completed' } });

    // Recent agreements
    const recentAgreements = await Agreement.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address'] },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      ],
    });

    // Recent users
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalOwners,
          totalBuyers,
          totalProperties,
          publishedProperties,
          draftProperties,
          totalAgreements,
          pendingAgreements,
          approvedAgreements,
          rejectedAgreements,
          completedAgreements,
          totalPayments,
          totalRevenue: totalRevenue || 0,
        },
        recentAgreements,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
