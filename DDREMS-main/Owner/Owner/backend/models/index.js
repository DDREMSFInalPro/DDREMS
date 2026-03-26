/**
 * Models Index
 * Initialize all Sequelize models and define associations
 */
const sequelize = require("../config/db");
const User = require("./User");
const Property = require("./Property");
const PropertyImage = require("./PropertyImage");
const PropertyDocument = require("./PropertyDocument");
const Payment = require("./Payment");
const Agreement = require("./Agreement");
const NegotiationHistory = require("./NegotiationHistory");

// ==========================================
// Associations
// ==========================================

// User → Properties (one-to-many)
User.hasMany(Property, { foreignKey: "owner_id", as: "properties" });
Property.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

// Property → Images (one-to-many)
Property.hasMany(PropertyImage, { foreignKey: "property_id", as: "images" });
PropertyImage.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});

// Property → Documents (one-to-many) — ownership certificates
Property.hasMany(PropertyDocument, {
  foreignKey: "property_id",
  as: "documents",
});
PropertyDocument.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});

// Property → Payments (one-to-many)
Property.hasMany(Payment, { foreignKey: "property_id", as: "payments" });
Payment.belongsTo(Property, { foreignKey: "property_id", as: "property" });

// User → Payments as owner (one-to-many)
User.hasMany(Payment, { foreignKey: "owner_id", as: "receivedPayments" });
Payment.belongsTo(User, { foreignKey: "owner_id", as: "ownerUser" });

// User → Payments as payer (one-to-many)
User.hasMany(Payment, { foreignKey: "payer_id", as: "madePayments" });
Payment.belongsTo(User, { foreignKey: "payer_id", as: "payer" });

// Property → Agreements (one-to-many)
Property.hasMany(Agreement, { foreignKey: "property_id", as: "agreements" });
Agreement.belongsTo(Property, { foreignKey: "property_id", as: "property" });

// User → Agreements as owner (one-to-many)
User.hasMany(Agreement, { foreignKey: "owner_id", as: "agreements" });
Agreement.belongsTo(User, { foreignKey: "owner_id", as: "ownerUser" });

// User → Agreements as buyer (one-to-many)
User.hasMany(Agreement, { foreignKey: "buyer_id", as: "agreementRequests" });
Agreement.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });

// Agreement → NegotiationHistory (one-to-many)
Agreement.hasMany(NegotiationHistory, {
  foreignKey: "agreement_id",
  as: "negotiationHistory",
});
NegotiationHistory.belongsTo(Agreement, {
  foreignKey: "agreement_id",
  as: "agreement",
});

module.exports = {
  sequelize,
  User,
  Property,
  PropertyImage,
  PropertyDocument,
  Payment,
  Agreement,
  NegotiationHistory,
};
