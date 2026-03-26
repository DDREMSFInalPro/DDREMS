/**
 * Payment Model
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  propertyId: { type: DataTypes.UUID, allowNull: false, field: 'property_id' },
  buyerId: { type: DataTypes.UUID, allowNull: false, field: 'buyer_id' },
  ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
  agreementId: { type: DataTypes.UUID, field: 'agreement_id' },
  buyerId: { type: DataTypes.UUID, field: 'buyer_id' },
  paymentMethod: { type: DataTypes.STRING(30), field: 'payment_method' },
  paymentGateway: { type: DataTypes.STRING(20), field: 'payment_gateway' },
  transactionId: { type: DataTypes.STRING(200), field: 'transaction_id' },
  receiptUrl: { type: DataTypes.STRING(500), field: 'receipt_url' },
  paymentStatus: { type: DataTypes.STRING(30), defaultValue: 'pending', field: 'payment_status' },
  referenceNumber: { type: DataTypes.STRING(100), field: 'reference_number' },
  description: { type: DataTypes.TEXT },
  ownerConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'owner_confirmed' },
  ownerConfirmedAt: { type: DataTypes.DATE, field: 'owner_confirmed_at' },
  adminVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'admin_verified' },
  adminVerifiedAt: { type: DataTypes.DATE, field: 'admin_verified_at' },
  paidAt: { type: DataTypes.DATE, field: 'paid_at' },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;
