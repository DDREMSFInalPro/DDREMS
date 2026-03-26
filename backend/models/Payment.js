/**
 * Payment Model
 */
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "property_id",
      },
      payerId: { type: DataTypes.UUID, allowNull: false, field: "payer_id" },
      ownerId: { type: DataTypes.UUID, allowNull: false, field: "owner_id" },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      paymentMethod: {
        type: DataTypes.ENUM("bank_transfer", "cash", "mobile_money", "check"),
        allowNull: false,
        field: "payment_method",
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
        defaultValue: "pending",
        field: "payment_status",
      },
      referenceNumber: {
        type: DataTypes.STRING(100),
        unique: true,
        field: "reference_number",
      },
      description: { type: DataTypes.TEXT },
      paidAt: { type: DataTypes.DATE, field: "paid_at" },
    },
    {
      tableName: "payments",
      timestamps: true,
      underscored: true,
    },
  );

  return Payment;
};
