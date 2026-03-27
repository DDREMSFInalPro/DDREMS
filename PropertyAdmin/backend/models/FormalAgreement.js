const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FormalAgreement = sequelize.define(
  "FormalAgreement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    negotiationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "negotiation_id",
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "property_id",
    },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: "owner_id" },
    buyerId: { type: DataTypes.UUID, allowNull: false, field: "buyer_id" },
    finalPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "final_price",
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "payment_method",
    },
    paymentDeadline: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "payment_deadline",
    },
    terms: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING(30), defaultValue: "agreement_created" },
    ownerSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "owner_signed",
    },
    ownerSignedAt: { type: DataTypes.DATE, field: "owner_signed_at" },
    buyerSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "buyer_signed",
    },
    buyerSignedAt: { type: DataTypes.DATE, field: "buyer_signed_at" },
    paymentStatus: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
      field: "payment_status",
    },
    paymentProofUrl: {
      type: DataTypes.STRING(500),
      field: "payment_proof_url",
    },
    paymentUploadedAt: { type: DataTypes.DATE, field: "payment_uploaded_at" },
    paymentVerifiedAt: { type: DataTypes.DATE, field: "payment_verified_at" },
    pdfUrl: { type: DataTypes.STRING(500), field: "pdf_url" },
  },
  { tableName: "formal_agreements", timestamps: true, underscored: true },
);

module.exports = FormalAgreement;
