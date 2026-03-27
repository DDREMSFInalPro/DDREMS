/**
 * Model Index – PropertyAdmin Module
 * Initializes models and their associations
 */
const sequelize = require("../config/db");
const User = require("./User");
const Property = require("./Property");
const PropertyImage = require("./PropertyImage");
const Payment = require("./Payment");
const Agreement = require("./Agreement");
const NegotiationHistory = require("./NegotiationHistory");
const FormalAgreement = require("./FormalAgreement");

// ---- Associations ----

// User → Properties (one owner has many properties)
User.hasMany(Property, { foreignKey: "ownerId", as: "properties" });
Property.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

// Property → Images
Property.hasMany(PropertyImage, { foreignKey: "propertyId", as: "images" });
PropertyImage.belongsTo(Property, { foreignKey: "propertyId", as: "property" });

// Agreement associations
Agreement.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
Agreement.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
Agreement.belongsTo(Property, { foreignKey: "propertyId", as: "property" });

// Agreement → NegotiationHistory (one-to-many)
Agreement.hasMany(NegotiationHistory, {
  foreignKey: "agreementId",
  as: "negotiationHistory",
});
NegotiationHistory.belongsTo(Agreement, {
  foreignKey: "agreementId",
  as: "agreement",
});

// Agreement → Payments
Agreement.hasMany(Payment, { foreignKey: "agreement_id", as: "payments" });
Payment.belongsTo(Agreement, {
  foreignKey: "agreement_id",
  as: "agreementRef",
});

// Payment associations — payer_id is the actual buyer FK used by Buyer backend
Payment.belongsTo(User, { foreignKey: "payerId", as: "buyer" });
Payment.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
Payment.belongsTo(Property, { foreignKey: "propertyId", as: "property" });

// FormalAgreement associations
FormalAgreement.belongsTo(Agreement, {
  foreignKey: "negotiationId",
  as: "negotiation",
});
Agreement.hasOne(FormalAgreement, {
  foreignKey: "negotiationId",
  as: "formalAgreement",
});
FormalAgreement.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
FormalAgreement.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });
FormalAgreement.belongsTo(Property, {
  foreignKey: "propertyId",
  as: "property",
});

module.exports = {
  sequelize,
  User,
  Property,
  PropertyImage,
  Payment,
  Agreement,
  NegotiationHistory,
  FormalAgreement,
};
