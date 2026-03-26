/**
 * Dashboard Controller
 * Unified dashboard for all roles — returns role-specific stats in one endpoint.
 *
 * GET /api/dashboard
 *   - admin  → system-wide stats
 *   - owner  → their properties, agreements, revenue
 *   - buyer  → their saved properties, agreements, payments
 */
const { Op } = require("sequelize");
const {
  sequelize,
  User,
  Property,
  Agreement,
  Payment,
  SavedProperty,
} = require("../models");

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalOwners,
    totalBuyers,
    totalProperties,
    publishedProperties,
    totalAgreements,
    pendingAgreements,
    approvedAgreements,
    completedAgreements,
    rejectedAgreements,
    totalPayments,
    totalRevenue,
    recentAgreements,
    recentUsers,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { role: "owner" } }),
    User.count({ where: { role: "buyer" } }),
    Property.scope(null).count({ where: { isDeleted: false } }),
    Property.scope(null).count({
      where: { isPublished: true, isDeleted: false },
    }),
    Agreement.count(),
    Agreement.count({ where: { status: "pending" } }),
    Agreement.count({ where: { status: "owner_approved" } }),
    Agreement.count({ where: { status: "completed" } }),
    Agreement.count({ where: { status: "owner_rejected" } }),
    Payment.count({ where: { paymentStatus: "completed" } }),
    Payment.sum("amount", { where: { paymentStatus: "completed" } }),
    Agreement.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address"],
        },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
        { model: User, as: "ownerUser", attributes: ["id", "name", "email"] },
      ],
    }),
    User.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "name", "email", "role", "isActive", "createdAt"],
    }),
  ]);

  return {
    summary: {
      totalUsers,
      totalOwners,
      totalBuyers,
      totalProperties,
      publishedProperties,
      totalAgreements,
      pendingAgreements,
      approvedAgreements,
      completedAgreements,
      rejectedAgreements,
      totalPayments,
      totalRevenue: totalRevenue || 0,
    },
    recentAgreements,
    recentUsers,
  };
};

// ─── Owner Dashboard ──────────────────────────────────────────────────────────

const getOwnerDashboard = async (ownerId) => {
  const [
    totalProperties,
    activeListings,
    totalAgreements,
    pendingAgreements,
    paymentStats,
    recentAgreements,
    recentProperties,
  ] = await Promise.all([
    Property.count({ where: { ownerId } }),
    Property.count({ where: { ownerId, isPublished: true } }),
    Agreement.count({ where: { ownerId } }),
    Agreement.count({ where: { ownerId, status: "pending" } }),
    Payment.findOne({
      where: { ownerId, paymentStatus: "completed" },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "totalCount"],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      ],
      raw: true,
    }),
    Agreement.findAll({
      where: { ownerId },
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [
        { model: Property, as: "property", attributes: ["id", "title"] },
        { model: User, as: "buyer", attributes: ["id", "name", "email"] },
      ],
    }),
    Property.findAll({
      where: { ownerId },
      attributes: [
        "id",
        "title",
        "price",
        "status",
        "isPublished",
        "propertyType",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
  ]);

  return {
    summary: {
      totalProperties,
      activeListings,
      totalAgreements,
      pendingAgreements,
      totalPayments: parseInt(paymentStats?.totalCount) || 0,
      totalRevenue: parseFloat(paymentStats?.totalAmount) || 0,
    },
    recentAgreements,
    recentProperties,
  };
};

// ─── Buyer Dashboard ──────────────────────────────────────────────────────────

const getBuyerDashboard = async (buyerId) => {
  const [
    totalSaved,
    totalAgreements,
    pendingAgreements,
    approvedAgreements,
    completedAgreements,
    totalPayments,
    totalAvailableProperties,
    recentAgreements,
  ] = await Promise.all([
    sequelize
      .query("SELECT COUNT(*) FROM saved_properties WHERE user_id = :buyerId", {
        replacements: { buyerId },
        type: "SELECT",
      })
      .then((r) => parseInt(r[0].count) || 0),
    Agreement.count({ where: { buyerId } }),
    Agreement.count({ where: { buyerId, status: "pending" } }),
    Agreement.count({ where: { buyerId, status: "owner_approved" } }),
    Agreement.count({ where: { buyerId, status: "completed" } }),
    Payment.count({ where: { payerId: buyerId } }),
    Property.scope(null).count({
      where: { isPublished: true, isDeleted: false },
    }),
    Agreement.findAll({
      where: { buyerId },
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "price", "propertyType"],
        },
      ],
    }),
  ]);

  return {
    summary: {
      totalSaved,
      totalAgreements,
      pendingAgreements,
      approvedAgreements,
      completedAgreements,
      totalPayments,
      totalAvailableProperties,
    },
    recentAgreements,
  };
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

const getDashboard = async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    let data;
    if (role === "admin") data = await getAdminDashboard();
    else if (role === "owner") data = await getOwnerDashboard(userId);
    else data = await getBuyerDashboard(userId);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
