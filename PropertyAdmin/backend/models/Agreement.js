/**
 * Agreement Model
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Agreement = sequelize.define('Agreement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  propertyId: { type: DataTypes.UUID, allowNull: false, field: 'property_id' },
  buyerId: { type: DataTypes.UUID, allowNull: false, field: 'buyer_id' },
  ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
  agreementType: { type: DataTypes.ENUM('sale', 'rental'), allowNull: false, field: 'agreement_type' },
  status: { type: DataTypes.STRING(20), defaultValue: 'pending', validate: { isIn: [['pending', 'forwarded_to_owner', 'counter_offer', 'counter_offer_sent', 'owner_approved', 'owner_rejected', 'completed']] } },
  terms: { type: DataTypes.TEXT },
  startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
  monthlyRent: { type: DataTypes.DECIMAL(12, 2), field: 'monthly_rent' },
  salePrice: { type: DataTypes.DECIMAL(12, 2), field: 'sale_price' },
  counterOfferPrice: { type: DataTypes.DECIMAL(15, 2), field: 'counter_offer_price' },
  ownerNotes: { type: DataTypes.TEXT, field: 'owner_notes' },
  pdfUrl: { type: DataTypes.STRING(500), field: 'pdf_url' },
  adminNote: { type: DataTypes.TEXT, field: 'admin_note' },
}, {
  tableName: 'agreements',
  timestamps: true,
  underscored: true,
});

module.exports = Agreement;
