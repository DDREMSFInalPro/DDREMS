/**
 * PropertyDocument Model
 * Stores locked ownership certificates with access keys
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const crypto = require('crypto');

const PropertyDocument = sequelize.define('PropertyDocument', {
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
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
  },
  fileType: {
    type: DataTypes.STRING(50),
    field: 'file_type',
  },
  fileSizeBytes: {
    type: DataTypes.BIGINT,
    field: 'file_size_bytes',
  },
  accessKey: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    field: 'access_key',
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_locked',
  },
  description: {
    type: DataTypes.STRING(255),
    defaultValue: 'Ownership Certificate',
  },
}, {
  tableName: 'property_documents',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

/**
 * Generate a random 16-character alphanumeric access key
 */
PropertyDocument.generateAccessKey = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

module.exports = PropertyDocument;
