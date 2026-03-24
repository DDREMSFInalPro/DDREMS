/**
 * Payment Controller
 * Handles payment listing for property owners
 */
const { Payment, Property, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all payments for the authenticated owner's properties
 * GET /api/payments/owner
 */
const getOwnerPayments = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      status,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build filter conditions
    const where = { ownerId };

    if (status) {
      where.paymentStatus = status;
    }

    if (search) {
      where[Op.or] = [
        { referenceNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Valid sort fields
    const allowedSortFields = ['createdAt', 'amount', 'paymentStatus', 'paidAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'propertyType'],
        },
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        payments,
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

module.exports = { getOwnerPayments };
