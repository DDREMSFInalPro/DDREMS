/**
 * Property Model
 * Represents real estate properties listed by owners
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    references: { model: 'users', key: 'id' },
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  propertyType: {
    type: DataTypes.ENUM('apartment', 'house', 'villa', 'commercial', 'land', 'office'),
    allowNull: false,
    field: 'property_type',
  },
  listingType: {
    type: DataTypes.ENUM('sale', 'rent'),
    allowNull: false,
    field: 'listing_type',
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  sizeSqm: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'size_sqm',
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    defaultValue: 'Dire Dawa',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
  },
  tourUrl3d: {
    type: DataTypes.STRING(500),
    field: 'tour_url_3d',
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted',
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'pending_approval', 'sold', 'rented', 'withdrawn'),
    defaultValue: 'draft',
  },
  amenities: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
  },
}, {
  tableName: 'properties',
  timestamps: true,
  underscored: true,
  // Default scope: exclude soft-deleted properties
  defaultScope: {
    where: { is_deleted: false },
  },
  scopes: {
    // Include soft-deleted
    withDeleted: {},
    // Only published
    published: {
      where: { is_published: true, is_deleted: false },
    },
  },
});

module.exports = Property;
