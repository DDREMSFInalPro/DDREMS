/**
 * User Management Controller (Admin Module)
 * List all users, view details, toggle active status
 */
const { Op } = require('sequelize');
const { User, Property } = require('../models');

/**
 * GET /api/users
 * List all users with optional filters
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, isActive, sortBy = 'createdAt', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
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
      attributes: { exclude: ['passwordHash'] },
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

/**
 * GET /api/users/:id
 * Get user details with their property count
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let propertyCount = 0;
    if (user.role === 'owner') {
      propertyCount = await Property.count({ where: { ownerId: user.id } });
    }

    res.json({
      success: true,
      data: { ...user.toJSON(), propertyCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/toggle-active
 * Activate or deactivate a user
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Don't allow deactivating yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { id: user.id, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, toggleUserActive };
