/**
 * Property Model
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Property = sequelize.define('Property', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  propertyType: { type: DataTypes.ENUM('apartment', 'house', 'villa', 'commercial', 'land', 'office'), allowNull: false, field: 'property_type' },
  listingType: { type: DataTypes.ENUM('sale', 'rent'), allowNull: false, field: 'listing_type' },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  sizeSqm: { type: DataTypes.DECIMAL(10, 2), field: 'size_sqm' },
  bedrooms: { type: DataTypes.INTEGER, defaultValue: 0 },
  bathrooms: { type: DataTypes.INTEGER, defaultValue: 0 },
  address: { type: DataTypes.TEXT, allowNull: false },
  city: { type: DataTypes.STRING(100), defaultValue: 'Dire Dawa' },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  amenities: { type: DataTypes.JSONB, defaultValue: [] },
  status: { type: DataTypes.ENUM('draft', 'active', 'sold', 'rented', 'withdrawn'), defaultValue: 'draft' },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_published' },
}, {
  tableName: 'properties',
  timestamps: true,
  underscored: true,
});

module.exports = Property;
