/**
 * SavedProperty Model
 * Tracks buyer's saved/favorited properties
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SavedProperty = sequelize.define('SavedProperty', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'property_id',
    references: { model: 'properties', key: 'id' },
  },
}, {
  tableName: 'saved_properties',
  timestamps: true,
  underscored: true,
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'property_id'],
    },
  ],
});

module.exports = SavedProperty;
