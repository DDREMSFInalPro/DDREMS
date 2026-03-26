/**
 * Models Index
 * Initializes all models and defines associations
 */
const { sequelize } = require("../config/database");

const User = require("./User")(sequelize);
const Property = require("./Property")(sequelize);
const PropertyImage = require("./PropertyImage")(sequelize);
const Agreement = require("./Agreement")(sequelize);
const NegotiationHistory = require("./NegotiationHistory")(sequelize);
const Payment = require("./Payment")(sequelize);
const SavedProperty = require("./SavedProperty")(sequelize);

// ─── Associations ─────────────────────────────────────────────────────────────

// User ↔ Property
User.hasMany(Property, { foreignKey: "owner_id", as: "properties" });
Property.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

// Property ↔ PropertyImage
Property.hasMany(PropertyImage, { foreignKey: "property_id", as: "images" });
PropertyImage.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});

// Agreement ↔ Property / User
Agreement.belongsTo(Property, { foreignKey: "property_id", as: "property" });
Agreement.belongsTo(User, { foreignKey: "owner_id", as: "ownerUser" });
Agreement.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });
Property.hasMany(Agreement, { foreignKey: "property_id", as: "agreements" });
User.hasMany(Agreement, { foreignKey: "owner_id", as: "ownerAgreements" });
User.hasMany(Agreement, { foreignKey: "buyer_id", as: "buyerAgreements" });

// Agreement ↔ NegotiationHistory
Agreement.hasMany(NegotiationHistory, {
  foreignKey: "agreement_id",
  as: "negotiationHistory",
});
NegotiationHistory.belongsTo(Agreement, {
  foreignKey: "agreement_id",
  as: "agreement",
});

// Payment ↔ Property / User
Payment.belongsTo(Property, { foreignKey: "property_id", as: "property" });
Payment.belongsTo(User, { foreignKey: "owner_id", as: "ownerUser" });
Payment.belongsTo(User, { foreignKey: "payer_id", as: "payer" });
Property.hasMany(Payment, { foreignKey: "property_id", as: "payments" });
User.hasMany(Payment, { foreignKey: "owner_id", as: "receivedPayments" });
User.hasMany(Payment, { foreignKey: "payer_id", as: "madePayments" });

// SavedProperty ↔ User / Property  (DB column is user_id, not buyer_id)
SavedProperty.belongsTo(User, { foreignKey: "user_id", as: "buyer" });
SavedProperty.belongsTo(Property, {
  foreignKey: "property_id",
  as: "property",
});
User.hasMany(SavedProperty, { foreignKey: "user_id", as: "savedProperties" });
Property.hasMany(SavedProperty, { foreignKey: "property_id", as: "savedBy" });

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  sequelize,
  User,
  Property,
  PropertyImage,
  Agreement,
  NegotiationHistory,
  Payment,
  SavedProperty,
};
