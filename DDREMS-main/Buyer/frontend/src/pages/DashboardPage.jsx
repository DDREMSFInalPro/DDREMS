/**
 * Dashboard Page (Buyer Module)
 * Shows buyer's summary statistics
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardAPI.getSummary();
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading dashboard...</p></div>;

  const { summary, recentAgreements } = data || {};

  const statusBadge = (status) => {
    const map = {
      pending: 'badge--warning',
      owner_approved: 'badge--success',
      owner_rejected: 'badge--danger',
      completed: 'badge--info',
    };
    return `badge ${map[status] || 'badge--default'}`;
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Buyer Dashboard</h1>
        <p>Welcome back! Here's an overview of your activity.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card--teal" onClick={() => navigate('/browse')}>
          <div className="stat-card__icon">🔍</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{summary?.totalAvailableProperties || 0}</span>
            <span className="stat-card__label">Available Properties</span>
          </div>
        </div>
        <div className="stat-card stat-card--pink" onClick={() => navigate('/saved')}>
          <div className="stat-card__icon">❤️</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{summary?.totalSaved || 0}</span>
            <span className="stat-card__label">Saved Properties</span>
          </div>
        </div>
        <div className="stat-card stat-card--blue" onClick={() => navigate('/agreements')}>
          <div className="stat-card__icon">📄</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{summary?.totalAgreements || 0}</span>
            <span className="stat-card__label">Agreement Requests</span>
          </div>
        </div>
        <div className="stat-card stat-card--amber" onClick={() => navigate('/payments')}>
          <div className="stat-card__icon">💰</div>
          <div className="stat-card__info">
            <span className="stat-card__value">{summary?.totalPayments || 0}</span>
            <span className="stat-card__label">Payments</span>
          </div>
        </div>
      </div>

      {/* Agreement Status Breakdown */}
      <div className="dashboard__row">
        <div className="card">
          <div className="card__header">
            <h3>Agreement Status Breakdown</h3>
          </div>
          <div className="card__body">
            <div className="status-breakdown">
              <div className="status-item">
                <span className="status-item__dot status-item__dot--warning"></span>
                <span>Pending</span>
                <strong>{summary?.pendingAgreements || 0}</strong>
              </div>
              <div className="status-item">
                <span className="status-item__dot status-item__dot--success"></span>
                <span>Approved</span>
                <strong>{summary?.approvedAgreements || 0}</strong>
              </div>
              <div className="status-item">
                <span className="status-item__dot status-item__dot--info"></span>
                <span>Completed</span>
                <strong>{summary?.completedAgreements || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3>Recent Agreement Requests</h3>
          </div>
          <div className="card__body">
            {recentAgreements?.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAgreements.map((a) => (
                      <tr key={a.id}>
                        <td>{a.property?.title || 'N/A'}</td>
                        <td className="capitalize">{a.agreementType}</td>
                        <td><span className={statusBadge(a.status)}>{a.status.replace('owner_', '').replace('_', ' ')}</span></td>
                        <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No agreement requests yet. <a href="/browse">Browse properties</a> to get started!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
