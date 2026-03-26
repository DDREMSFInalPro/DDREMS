/**
 * User Management Controller — Admin only
 *
 * GET    /api/users              - List all users
 * GET    /api/users/:id          - Get user details
 * PATCH  /api/users/:id/toggle-active - Activate / deactivate user
 */
const { Op } = require("sequelize");
const { User, Property } = require("../models");

const getUsers = async (req, res, next) => {
  try {
    const {
      role,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = "DESC",
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["passwordHash"] },
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        users: rows,
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

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["passwordHash"] },
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const propertyCount =
      user.role === "owner"
        ? await Property.count({ where: { ownerId: user.id } })
        : 0;

    res.json({ success: true, data: { ...user.toJSON(), propertyCount } });
  } catch (error) {
    next(error);
  }
};

const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    if (user.id === req.user.userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot deactivate your own account.",
        });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      data: { id: user.id, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, toggleUserActive };
