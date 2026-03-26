/**
 * User Model
 * Unified model for all roles: admin, owner, buyer
 */
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      role: {
        type: DataTypes.ENUM("admin", "owner", "buyer"),
        allowNull: false,
        defaultValue: "buyer",
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        field: "avatar_url",
      },
      address: {
        type: DataTypes.TEXT,
      },
      bio: {
        type: DataTypes.TEXT,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
    },
  );

  return User;
};
