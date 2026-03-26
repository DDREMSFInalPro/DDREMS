/**
 * Payment Controller — Unified
 *
 * GET /api/payments
 *   buyer → own payments made (as payer)
 *   owner → payments received on their properties
 *   admin → all payments system-wide
 */
const { Op } = require("sequelize");
const { Payment, Property, User } = require("../models");

const ALLOWED_SORT = ["createdAt", "amount", "paymentStatus", "paidAt"];

const getPayments = async (req, res, next) => {
  try {
    const { role, userId } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      search = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Role-based filter
    if (role === "buyer") where.payerId = userId;
    if (role === "owner") where.ownerId = userId;
    if (status) where.paymentStatus = status;

    if (search) {
      where[Op.or] = [
        { referenceNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const orderField = ALLOWED_SORT.includes(sortBy) ? sortBy : "createdAt";
    const orderDir = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Include the other party depending on role
    const include = [
      {
        model: Property,
        as: "property",
        attributes: ["id", "title", "address", "propertyType"],
      },
    ];
    if (role === "buyer") {
      include.push({
        model: User,
        as: "ownerUser",
        attributes: ["id", "name", "email", "phone"],
      });
    } else if (role === "owner") {
      include.push({
        model: User,
        as: "payer",
        attributes: ["id", "name", "email", "phone"],
      });
    } else {
      include.push({
        model: User,
        as: "payer",
        attributes: ["id", "name", "email"],
      });
      include.push({
        model: User,
        as: "ownerUser",
        attributes: ["id", "name", "email"],
      });
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        payments: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayments };
