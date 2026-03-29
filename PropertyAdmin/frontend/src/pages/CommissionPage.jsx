/**
 * Commission & Withdrawals Page (Admin Module)
 * Shows platform commission stats, all transactions, and withdrawal management
 */
import { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';

const CommissionPage = () => {
  const [stats, setStats]           = useState(null);
  const [payments, setPayments]     = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab, setTab]               = useState('commission');
  const [loading, setLoading]       = useState(true);
  const [wdFilter, setWdFilter]     = useState('');
  const [msg, setMsg]               = useState('');

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 'transactions') fetchPayments(); }, [tab]);
  useEffect(() => { if (tab === 'withdrawals') fetchWithdrawals(); }, [tab, wdFilter]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes] = await Promise.all([paymentAPI.getCommission()]);
      setStats(sRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPayments = async () => {
    try {
      const res = await paymentAPI.getAll({ paymentStatus: 'completed', limit: 50 });
      setPayments(res.data.data.payments);
    } catch (err) { console.error(err); }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await paymentAPI.getWithdrawals({ status: wdFilter || undefined });
      setWithdrawals(res.data.data.withdrawals);
    } catch (err) { console.error(err); }
  };

  const handleWithdrawal = async (id, status) => {
    const note = status === 'rejected' ? window.prompt('Reason for rejection (optional):') : null;
    try {
      await paymentAPI.updateWithdrawal(id, { status, adminNote: note });
      setMsg(`Withdrawal ${status} successfully.`);
      fetchWithdrawals();
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update withdrawal.');
    }
  };

  const wdBadge = (s) => {
    const map = { pending: 'badge--warning', approved: 'badge--info', paid: 'badge--success', rejected: 'badge--danger' };
    return `badge ${map[s] || 'badge--default'}`;
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading...</p></div>;

  return (
    <div className="commission-page">
      <div className="page-header">
        <h1>💰 Commission & Payments</h1>
        <p>Platform revenue, commission tracking, and owner withdrawals</p>
      </div>

      {msg && <div className="alert alert--success">{msg}</div>}

      {/* Commission stat cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-card--green">
          <div className="stat-card__icon">💵</div>
          <div className="stat-card__info">
            <span className="stat-card__value">ETB {Number(stats?.totalRevenue || 0).toLocaleString()}</span>
            <span className="stat-card__label">Total Revenue</span>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon">🏦</div>
          <div className="stat-card__info">
            <span className="stat-card__value">ETB {Number(stats?.totalCommission || 0).toLocaleString()}</span>
            <span className="stat-card__label">Platform Commission (15%)</span>
          </div>
        </div>
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon">🔑</div>
          <div className="stat-card__info">
            <span className="stat-card__value">ETB {Number(stats?.totalOwnerPayouts || 0).toLocaleString()}</span>
            <span className="stat-card__label">Owner Payouts (85%)</span>
          </div>
        </div>
        <div className="stat-card stat-card--amber">
          <div className="stat-card__icon">📊</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats?.totalTransactions || 0}</span>
            <span className="stat-card__label">Total Transactions</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['commission', 'transactions', 'withdrawals'].map((t) => (
          <button key={t} className={`btn btn--sm ${tab === t ? 'btn--primary' : 'btn--outline'}`} onClick={() => setTab(t)}>
            {t === 'commission' ? '📈 Monthly Breakdown' : t === 'transactions' ? '📋 Transactions' : '🏦 Withdrawals'}
          </button>
        ))}
      </div>

      {/* Monthly breakdown */}
      {tab === 'commission' && (
        <div className="card">
          <div className="card__header"><h3>Monthly Commission Breakdown</h3></div>
          <div className="card__body">
            {!stats?.monthly?.length ? (
              <div className="empty-state"><p>No completed transactions yet.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead><tr><th>Month</th><th>Transactions</th><th>Revenue</th><th>Commission (15%)</th></tr></thead>
                  <tbody>
                    {stats.monthly.map((m) => (
                      <tr key={m.month}>
                        <td>{m.month}</td>
                        <td>{m.transactions}</td>
                        <td>ETB {Number(m.revenue).toLocaleString()}</td>
                        <td style={{ color: '#6366f1', fontWeight: 700 }}>ETB {Number(m.commission).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All transactions */}
      {tab === 'transactions' && (
        <div className="card">
          <div className="card__header"><h3>Completed Transactions</h3></div>
          <div className="card__body">
            {payments.length === 0 ? (
              <div className="empty-state"><p>No completed transactions.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr><th>Reference</th><th>Property</th><th>Buyer</th><th>Owner</th><th>Amount</th><th>Commission</th><th>Owner Net</th><th>Gateway</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td><code>{p.referenceNumber || p.chapaTxRef || '—'}</code></td>
                        <td>{p.property?.title || 'N/A'}</td>
                        <td>{p.buyer?.name || 'N/A'}</td>
                        <td>{p.owner?.name || 'N/A'}</td>
                        <td><strong>ETB {Number(p.amount).toLocaleString()}</strong></td>
                        <td style={{ color: '#6366f1' }}>ETB {Number(p.commissionAmount || p.amount * 0.15).toLocaleString()}</td>
                        <td style={{ color: '#10b981' }}>ETB {Number(p.ownerNetAmount || p.amount * 0.85).toLocaleString()}</td>
                        <td><span className="badge badge--outline">{p.paymentGateway || p.paymentMethod}</span></td>
                        <td>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal management */}
      {tab === 'withdrawals' && (
        <div className="card">
          <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Owner Withdrawal Requests</h3>
            <select value={wdFilter} onChange={(e) => setWdFilter(e.target.value)} style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="card__body">
            {withdrawals.length === 0 ? (
              <div className="empty-state"><p>No withdrawal requests.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr><th>Owner</th><th>Amount</th><th>Bank</th><th>Account</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id}>
                        <td><strong>{w.owner_name}</strong><br /><small>{w.owner_email}</small></td>
                        <td><strong>ETB {Number(w.amount).toLocaleString()}</strong></td>
                        <td>{w.bank_name}</td>
                        <td>{w.account_number}<br /><small>{w.account_name}</small></td>
                        <td><span className={wdBadge(w.status)}>{w.status}</span></td>
                        <td>{new Date(w.created_at).toLocaleDateString()}</td>
                        <td>
                          {w.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn btn--sm btn--success" onClick={() => handleWithdrawal(w.id, 'approved')}>Approve</button>
                              <button className="btn btn--sm btn--danger" onClick={() => handleWithdrawal(w.id, 'rejected')}>Reject</button>
                            </div>
                          )}
                          {w.status === 'approved' && (
                            <button className="btn btn--sm btn--primary" onClick={() => handleWithdrawal(w.id, 'paid')}>Mark Paid</button>
                          )}
                          {['paid', 'rejected'].includes(w.status) && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionPage;
