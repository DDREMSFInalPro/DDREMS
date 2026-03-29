/**
 * Payment Controller (Admin Module)
 * List all payments + commission stats + withdrawal management
 */
const { Op } = require('sequelize');
const { Payment, Property, User, sequelize } = require('../models');

/**
 * GET /api/payments
 */
const getPayments = async (req, res, next) => {
  try {
    const {
      paymentStatus, search,
      sortBy = 'createdAt', sortOrder = 'DESC',
      page = 1, limit = 20,
    } = req.query;

    const where = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where[Op.or] = [
        { referenceNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title'] },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
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

/**
 * GET /api/payments/commission
 * Total commission earned by the platform
 */
const getCommissionStats = async (req, res, next) => {
  try {
    const [[stats]] = await sequelize.query(`
      SELECT
        COUNT(*)                                    AS total_transactions,
        COALESCE(SUM(amount), 0)                    AS total_revenue,
        COALESCE(SUM(commission_amount), 0)         AS total_commission,
        COALESCE(SUM(owner_net_amount), 0)          AS total_owner_payouts,
        COALESCE(AVG(commission_rate), 15)          AS avg_commission_rate
      FROM payments
      WHERE payment_status = 'completed'
    `);

    const [monthly] = await sequelize.query(`
      SELECT
        TO_CHAR(paid_at, 'YYYY-MM') AS month,
        COUNT(*)                    AS transactions,
        COALESCE(SUM(amount), 0)    AS revenue,
        COALESCE(SUM(commission_amount), 0) AS commission
      FROM payments
      WHERE payment_status = 'completed' AND paid_at IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    res.json({
      success: true,
      data: {
        totalTransactions:  parseInt(stats.total_transactions),
        totalRevenue:       parseFloat(stats.total_revenue),
        totalCommission:    parseFloat(stats.total_commission),
        totalOwnerPayouts:  parseFloat(stats.total_owner_payouts),
        avgCommissionRate:  parseFloat(stats.avg_commission_rate),
        monthly,
      },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/payments/withdrawals
 * All withdrawal requests
 */
const getWithdrawals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = status ? `WHERE wr.status = '${status}'` : '';
    const [rows] = await sequelize.query(`
      SELECT wr.*, u.name AS owner_name, u.email AS owner_email
      FROM withdrawal_requests wr
      JOIN users u ON u.id = wr.owner_id
      ${whereClause}
      ORDER BY wr.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `);

    const [[{ total }]] = await sequelize.query(`
      SELECT COUNT(*) AS total FROM withdrawal_requests ${whereClause}
    `);

    res.json({
      success: true,
      data: {
        withdrawals: rows,
        pagination: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(parseInt(total) / parseInt(limit)) },
      },
    });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/payments/withdrawals/:id
 * Approve, reject, or mark as paid
 */
const updateWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved, rejected, or paid.' });
    }

    const [[withdrawal]] = await sequelize.query(
      `SELECT * FROM withdrawal_requests WHERE id = :id`,
      { replacements: { id } }
    );
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found.' });

    await sequelize.query(
      `UPDATE withdrawal_requests
       SET status = :status, admin_note = :adminNote, processed_at = NOW(), updated_at = NOW()
       WHERE id = :id`,
      { replacements: { id, status, adminNote: adminNote || null } }
    );

    // If paid, deduct from wallet balance and add to total_withdrawn
    if (status === 'paid') {
      await sequelize.query(
        `UPDATE owner_wallets
         SET balance = balance - :amount, total_withdrawn = total_withdrawn + :amount, updated_at = NOW()
         WHERE owner_id = :ownerId`,
        { replacements: { amount: withdrawal.amount, ownerId: withdrawal.owner_id } }
      );
    }

    res.json({ success: true, message: `Withdrawal ${status} successfully.` });
  } catch (error) { next(error); }
};

module.exports = { getPayments, getCommissionStats, getWithdrawals, updateWithdrawal };
