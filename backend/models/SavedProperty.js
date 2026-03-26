/**
 * SavedProperty Model
 * Note: DB column is user_id (not buyer_id)
 */
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SavedProperty = sequelize.define(
    "SavedProperty",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      buyerId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "property_id",
      },
    },
    {
      tableName: "saved_properties",
      timestamps: true,
      underscored: true,
      updatedAt: false,
      indexes: [{ unique: true, fields: ["user_id", "property_id"] }],
    },
  );

  return SavedProperty;
};
