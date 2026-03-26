/**
 * NegotiationHistory Model
 */
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NegotiationHistory = sequelize.define(
    "NegotiationHistory",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      agreementId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "agreement_id",
      },
      actorType: {
        type: DataTypes.ENUM("buyer", "owner"),
        allowNull: false,
        field: "actor_type",
      },
      actionType: {
        type: DataTypes.ENUM(
          "initial_request",
          "counter_offer",
          "accept",
          "reject",
        ),
        allowNull: false,
        field: "action_type",
      },
      price: { type: DataTypes.DECIMAL(15, 2) },
      notes: { type: DataTypes.TEXT },
    },
    {
      tableName: "negotiation_history",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );

  return NegotiationHistory;
};
