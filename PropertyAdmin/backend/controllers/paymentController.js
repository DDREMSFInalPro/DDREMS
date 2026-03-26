/**
 * Payment Controller (Admin Module)
 * List all payments across the system
 */
const { Op } = require('sequelize');
const { Payment, Property, User } = require('../models');

/**
 * GET /api/payments
 */
const getPayments = async (req, res, next) => {
  try {
    const {
      paymentStatus, search,
      sortBy = 'createdAt', sortOrder = 'DESC',
      page = 1, limit = 20,
    } = req.query;

    const where = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where[Op.or] = [
        { referenceNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title'] },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        payments: rows,
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

module.exports = { getPayments };
