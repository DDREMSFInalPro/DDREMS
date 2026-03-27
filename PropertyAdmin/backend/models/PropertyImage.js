/**
 * PropertyImage Model
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PropertyImage = sequelize.define('PropertyImage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  propertyId: { type: DataTypes.UUID, allowNull: false, field: 'property_id' },
  imageUrl: { type: DataTypes.STRING(500), allowNull: false, field: 'image_url' },
  isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_primary' },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, field: 'sort_order' },
}, {
  tableName: 'property_images',
  timestamps: true,
  underscored: true,
});

module.exports = PropertyImage;
