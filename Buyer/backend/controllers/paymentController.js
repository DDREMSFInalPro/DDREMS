const { Payment, Property, User, Agreement } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const getBuyerPayments = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { payerId: buyerId };
    if (status) where.paymentStatus = status;
    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'address', 'propertyType'] },
        { model: User, as: 'ownerUser', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ success: true, data: { payments, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } } });
  } catch (error) { next(error); }
};

const submitPayment = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const { agreementId, paymentGateway, transactionId, amount, notes } = req.body;
    if (!agreementId || !paymentGateway || !transactionId || !amount) {
      return res.status(400).json({ success: false, message: 'agreementId, paymentGateway, transactionId and amount are required.' });
    }
    const agreement = await Agreement.findOne({ where: { id: agreementId, buyerId } });
    if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found.' });
    if (agreement.status !== 'owner_approved') {
      return res.status(400).json({ success: false, message: 'Payment can only be submitted for owner-approved agreements.' });
    }
    const existing = await Payment.findOne({ where: { agreementId, payerId: buyerId, paymentStatus: { [Op.in]: ['pending', 'completed'] } } });
    if (existing) return res.status(400).json({ success: false, message: 'Payment already submitted for this agreement.' });
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const payment = await Payment.create({
      id: uuidv4(),
      propertyId: agreement.propertyId,
      payerId: buyerId,
      buyerId,
      ownerId: agreement.ownerId,
      agreementId,
      amount: parseFloat(amount),
      paymentGateway,
      paymentMethod: paymentGateway,
      transactionId,
      receiptUrl,
      referenceNumber: `PAY-${Date.now()}`,
      description: notes || `Payment for agreement ${agreementId}`,
      paymentStatus: 'pending',
      paidAt: new Date(),
    });
    await agreement.update({ status: 'payment_submitted' });
    res.status(201).json({ success: true, message: 'Payment submitted. Awaiting admin verification.', data: payment });
  } catch (error) { next(error); }
};

const getPaymentByAgreement = async (req, res, next) => {
  try {
    const buyerId = req.user.userId;
    const payment = await Payment.findOne({
      where: { agreementId: req.params.agreementId, payerId: buyerId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: payment });
  } catch (error) { next(error); }
};

module.exports = { getBuyerPayments, submitPayment, getPaymentByAgreement };
