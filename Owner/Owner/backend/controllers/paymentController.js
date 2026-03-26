const { Payment, Property, User } = require('../models');
const { Op } = require('sequelize');

const getOwnerPayments = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10, status, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const where = { ownerId };
    if (status) where.paymentStatus = status;
    if (search) where[Op.or] = [{ referenceNumber: { [Op.iLike]: `%${search}%` } }];
    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType'] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ success: true, data: { payments, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } } });
  } catch (error) { next(error); }
};

const getPaymentByAgreement = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const payment = await Payment.findOne({
      where: { agreementId: req.params.agreementId, ownerId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: payment });
  } catch (error) { next(error); }
};

module.exports = { getOwnerPayments, getPaymentByAgreement };
