/**
 * Wallet Page (Owner Module)
 * Shows earnings, balance, transaction history, and withdrawal system
 */
import { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';

const WalletPage = () => {
  const [wallet, setWallet]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('overview'); // overview | transactions | withdraw
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' });
  const [submitting, setSubmitting]   = useState(false);
  const [msg, setMsg]                 = useState({ type: '', text: '' });
  const [txPage, setTxPage]           = useState(1);
  const [txPagination, setTxPagination] = useState({});

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 'transactions') fetchTransactions(); }, [tab, txPage]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [wRes, wdRes] = await Promise.all([walletAPI.get(), walletAPI.getWithdrawals()]);
      setWallet(wRes.data.data);
      setWithdrawals(wdRes.data.data);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to load wallet.' });
    } finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    try {
      const res = await walletAPI.getTransactions({ page: txPage, limit: 10 });
      setTransactions(res.data.data.transactions);
      setTxPagination(res.data.data.pagination);
    } catch (err) { console.error(err); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      await walletAPI.withdraw(withdrawForm);
      setMsg({ type: 'success', text: 'Withdrawal request submitted successfully!' });
      setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountName: '' });
      fetchAll();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit withdrawal.' });
    } finally { setSubmitting(false); }
  };

  const statusBadge = (s) => {
    const map = { pending: 'badge--warning', approved: 'badge--info', paid: 'badge--success', rejected: 'badge--danger' };
    return `badge ${map[s] || 'badge--default'}`;
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading wallet...</p></div>;

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>💰 My Wallet</h1>
        <p className="page-header__subtitle">Track your earnings and manage withdrawals</p>
      </div>

      {msg.text && <div className={`alert alert--${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

      {/* Balance cards */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-card--green">
          <div className="stat-card__icon">💵</div>
          <div className="stat-card__content">
            <span className="stat-card__value">ETB {(wallet?.availableBalance || 0).toLocaleString()}</span>
            <span className="stat-card__label">Available Balance</span>
          </div>
        </div>
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon">📈</div>
          <div className="stat-card__content">
            <span className="stat-card__value">ETB {(wallet?.totalEarned || 0).toLocaleString()}</span>
            <span className="stat-card__label">Total Earned</span>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon">🏦</div>
          <div className="stat-card__content">
            <span className="stat-card__value">ETB {(wallet?.totalWithdrawn || 0).toLocaleString()}</span>
            <span className="stat-card__label">Total Withdrawn</span>
          </div>
        </div>
        <div className="stat-card stat-card--orange">
          <div className="stat-card__icon">⏳</div>
          <div className="stat-card__content">
            <span className="stat-card__value">ETB {(wallet?.pendingWithdrawals || 0).toLocaleString()}</span>
            <span className="stat-card__label">Pending Withdrawals</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['overview', 'transactions', 'withdraw'].map((t) => (
          <button key={t} className={`btn btn--sm ${tab === t ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Withdrawals' : t === 'transactions' ? '📋 Transactions' : '🏦 Request Withdrawal'}
          </button>
        ))}
      </div>

      {/* Withdrawal history */}
      {tab === 'overview' && (
        <div className="card">
          <div className="card__header"><h3>Withdrawal Requests</h3></div>
          <div className="card__body">
            {withdrawals.length === 0 ? (
              <div className="empty-state"><p>No withdrawal requests yet.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead><tr><th>Amount</th><th>Bank</th><th>Account</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id}>
                        <td><strong>ETB {Number(w.amount).toLocaleString()}</strong></td>
                        <td>{w.bank_name}</td>
                        <td>{w.account_number} — {w.account_name}</td>
                        <td><span className={statusBadge(w.status)}>{w.status}</span></td>
                        <td>{new Date(w.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction history */}
      {tab === 'transactions' && (
        <div className="card">
          <div className="card__header"><h3>Earnings History</h3></div>
          <div className="card__body">
            {transactions.length === 0 ? (
              <div className="empty-state"><p>No completed payments yet.</p></div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr><th>Property</th><th>Buyer</th><th>Total Amount</th><th>Commission (15%)</th><th>Your Earnings</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id}>
                          <td>{t.property?.title || 'N/A'}</td>
                          <td>{t.payer?.name || 'N/A'}</td>
                          <td>ETB {Number(t.amount).toLocaleString()}</td>
                          <td style={{ color: '#ef4444' }}>- ETB {Number(t.commission_amount || t.amount * 0.15).toLocaleString()}</td>
                          <td style={{ color: '#10b981', fontWeight: 700 }}>ETB {Number(t.owner_net_amount || t.amount * 0.85).toLocaleString()}</td>
                          <td>{new Date(t.paid_at || t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {txPagination.totalPages > 1 && (
                  <div className="pagination">
                    <button className="btn btn--outline btn--sm" disabled={txPage <= 1} onClick={() => setTxPage(txPage - 1)}>Previous</button>
                    <span className="pagination__info">Page {txPage} of {txPagination.totalPages}</span>
                    <button className="btn btn--outline btn--sm" disabled={txPage >= txPagination.totalPages} onClick={() => setTxPage(txPage + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal request form */}
      {tab === 'withdraw' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card__header"><h3>Request Withdrawal</h3></div>
          <div className="card__body">
            <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
              Available balance: <strong>ETB {(wallet?.availableBalance || 0).toLocaleString()}</strong>
            </p>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label>Amount (ETB) *</label>
                <input type="number" min="1" max={wallet?.availableBalance || 0} value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Bank Name *</label>
                <select value={withdrawForm.bankName} onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })} required>
                  <option value="">Select bank</option>
                  <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="Abyssinia">Bank of Abyssinia</option>
                  <option value="Awash">Awash Bank</option>
                  <option value="Dashen">Dashen Bank</option>
                  <option value="Telebirr">Telebirr</option>
                </select>
              </div>
              <div className="form-group">
                <label>Account Number *</label>
                <input type="text" value={withdrawForm.accountNumber}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Account Holder Name *</label>
                <input type="text" value={withdrawForm.accountName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '🏦 Request Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
