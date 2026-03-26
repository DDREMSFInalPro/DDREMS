/**
 * Agreement Model
 * Tracks agreement requests from buyers and their approval workflow
 * Flow: buyer requests → admin forwards → owner approves/rejects → admin generates PDF
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Agreement = sequelize.define(
  "Agreement",
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
      references: { model: "properties", key: "id" },
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "owner_id",
      references: { model: "users", key: "id" },
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "buyer_id",
      references: { model: "users", key: "id" },
    },
    clientName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "client_name",
    },
    clientEmail: {
      type: DataTypes.STRING(150),
      field: "client_email",
    },
    clientPhone: {
      type: DataTypes.STRING(20),
      field: "client_phone",
    },
    agreementType: {
      type: DataTypes.ENUM("sale", "rental"),
      allowNull: false,
      field: "agreement_type",
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [
          [
            "pending",
            "forwarded_to_owner",
            "counter_offer",
            "counter_offer_sent",
            "buyer_accepted_counter",
            "buyer_rejected_counter",
            "buyer_counter_offer",
            "buyer_counter_forwarded",
            "owner_approved",
            "owner_rejected",
            "completed",
          ],
        ],
      },
    },
    terms: {
      type: DataTypes.TEXT,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: "start_date",
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: "end_date",
    },
    monthlyRent: {
      type: DataTypes.DECIMAL(15, 2),
      field: "monthly_rent",
    },
    salePrice: {
      type: DataTypes.DECIMAL(15, 2),
      field: "sale_price",
    },
    adminNotes: {
      type: DataTypes.TEXT,
      field: "admin_notes",
    },
    counterOfferPrice: {
      type: DataTypes.DECIMAL(15, 2),
      field: "counter_offer_price",
    },
    ownerNotes: {
      type: DataTypes.TEXT,
      field: "owner_notes",
    },
    buyerCounterPrice: {
      type: DataTypes.DECIMAL(15, 2),
      field: "buyer_counter_price",
    },
    buyerNotes: {
      type: DataTypes.TEXT,
      field: "buyer_notes",
    },
    ownerCounterAt: {
      type: DataTypes.DATE,
      field: "owner_counter_at",
    },
    buyerCounterAt: {
      type: DataTypes.DATE,
      field: "buyer_counter_at",
    },
    forwardedAt: {
      type: DataTypes.DATE,
      field: "forwarded_at",
    },
    ownerResponseAt: {
      type: DataTypes.DATE,
      field: "owner_response_at",
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      field: "pdf_url",
    },
  },
  {
    tableName: "agreements",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Agreement;
