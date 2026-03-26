/**
 * Dashboard Controller
 * Provides summary statistics for the owner's dashboard
 */
const { Property, Payment, Agreement, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Get dashboard summary for the authenticated owner
 * GET /api/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;

    // Total properties count
    const totalProperties = await Property.count({
      where: { ownerId },
    });

    // Active listings (published properties)
    const activeListings = await Property.count({
      where: { ownerId, isPublished: true },
    });

    // Total payments received
    const paymentStats = await Payment.findOne({
      where: { ownerId, paymentStatus: 'completed' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      raw: true,
    });

    // Total agreements
    const totalAgreements = await Agreement.count({
      where: { ownerId },
    });

    // Recent payments (last 5)
    const recentPayments = await Payment.findAll({
      where: { ownerId },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title'],
        },
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Recent properties (last 5)
    const recentProperties = await Property.findAll({
      where: { ownerId },
      attributes: ['id', 'title', 'price', 'status', 'isPublished', 'propertyType', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Properties by status
    const propertiesByStatus = await Property.findAll({
      where: { ownerId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalProperties,
          activeListings,
          totalPayments: parseInt(paymentStats.totalCount) || 0,
          totalRevenue: parseFloat(paymentStats.totalAmount) || 0,
          totalAgreements,
        },
        recentPayments,
        recentProperties,
        propertiesByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
