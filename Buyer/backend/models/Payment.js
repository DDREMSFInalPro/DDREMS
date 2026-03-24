/**
 * Payment Model
 * Tracks payments made by buyers
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'property_id',
    references: { model: 'properties', key: 'id' },
  },
  payerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'payer_id',
    references: { model: 'users', key: 'id' },
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    references: { model: 'users', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('bank_transfer', 'cash', 'mobile_money', 'check'),
    allowNull: false,
    field: 'payment_method',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending',
    field: 'payment_status',
  },
  referenceNumber: {
    type: DataTypes.STRING(100),
    unique: true,
    field: 'reference_number',
  },
  description: {
    type: DataTypes.TEXT,
  },
  paidAt: {
    type: DataTypes.DATE,
    field: 'paid_at',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;
