/**
 * Wallet Controller (Owner Module)
 * Wallet balance, earnings history, withdrawal requests
 */
const sequelize = require('../config/db');
const { Payment, Property, User } = require('../models');

// ── GET /api/wallet ───────────────────────────────────────────────────────────

const getWallet = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;

    // Ensure wallet row exists
    await sequelize.query(
      `INSERT INTO owner_wallets (owner_id) VALUES (:ownerId) ON CONFLICT (owner_id) DO NOTHING`,
      { replacements: { ownerId } }
    );

    const [[wallet]] = await sequelize.query(
      `SELECT * FROM owner_wallets WHERE owner_id = :ownerId`,
      { replacements: { ownerId } }
    );

    // Pending withdrawals
    const [[{ pending_withdrawals }]] = await sequelize.query(
      `SELECT COALESCE(SUM(amount),0) AS pending_withdrawals
       FROM withdrawal_requests WHERE owner_id = :ownerId AND status = 'pending'`,
      { replacements: { ownerId } }
    );

    res.json({
      success: true,
      data: {
        balance:           parseFloat(wallet.balance),
        totalEarned:       parseFloat(wallet.total_earned),
        totalWithdrawn:    parseFloat(wallet.total_withdrawn),
        pendingWithdrawals: parseFloat(pending_withdrawals),
        availableBalance:  parseFloat(wallet.balance) - parseFloat(pending_withdrawals),
      },
    });
  } catch (error) { next(error); }
};

// ── GET /api/wallet/transactions ─────────────────────────────────────────────

const getTransactions = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.findAndCountAll({
      where: { ownerId, paymentStatus: 'completed' },
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title'] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
      ],
      order: [['paidAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        transactions: payments.rows,
        pagination: {
          total: payments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(payments.count / parseInt(limit)),
        },
      },
    });
  } catch (error) { next(error); }
};

// ── POST /api/wallet/withdraw ─────────────────────────────────────────────────

const requestWithdrawal = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { amount, bankName, accountNumber, accountName } = req.body;

    if (!amount || !bankName || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: 'amount, bankName, accountNumber and accountName are required.' });
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    }

    // Check available balance
    const [[wallet]] = await sequelize.query(
      `SELECT balance FROM owner_wallets WHERE owner_id = :ownerId`,
      { replacements: { ownerId } }
    );
    if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found.' });

    const [[{ pending }]] = await sequelize.query(
      `SELECT COALESCE(SUM(amount),0) AS pending FROM withdrawal_requests WHERE owner_id = :ownerId AND status = 'pending'`,
      { replacements: { ownerId } }
    );

    const available = parseFloat(wallet.balance) - parseFloat(pending);
    if (parsedAmount > available) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ETB ${available.toLocaleString()}` });
    }

    const [[result]] = await sequelize.query(
      `INSERT INTO withdrawal_requests (owner_id, amount, bank_name, account_number, account_name)
       VALUES (:ownerId, :amount, :bankName, :accountNumber, :accountName)
       RETURNING *`,
      { replacements: { ownerId, amount: parsedAmount, bankName, accountNumber, accountName } }
    );

    res.status(201).json({ success: true, message: 'Withdrawal request submitted. Admin will process it shortly.', data: result });
  } catch (error) { next(error); }
};

// ── GET /api/wallet/withdrawals ───────────────────────────────────────────────

const getWithdrawals = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const [withdrawals] = await sequelize.query(
      `SELECT * FROM withdrawal_requests WHERE owner_id = :ownerId ORDER BY created_at DESC`,
      { replacements: { ownerId } }
    );
    res.json({ success: true, data: withdrawals });
  } catch (error) { next(error); }
};

module.exports = { getWallet, getTransactions, requestWithdrawal, getWithdrawals };
