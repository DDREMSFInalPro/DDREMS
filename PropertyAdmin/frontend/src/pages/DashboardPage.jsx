import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getSummary().then((res) => setData(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading dashboard...</p></div>;
  const { summary, recentAgreements, recentUsers } = data || {};

  const statusBadge = (status) => {
    const map = { pending: 'badge--warning', owner_approved: 'badge--success', owner_rejected: 'badge--danger', completed: 'badge--info' };
    return `badge ${map[status] || 'badge--default'}`;
  };

  return (
    <div className="dashboard">
      <div className="page-header"><h1>Admin Dashboard</h1><p>System-wide overview</p></div>

      <div className="stats-grid">
        <div className="stat-card stat-card--purple" onClick={() => navigate('/users')}><div className="stat-card__icon">👥</div><div className="stat-card__info"><span className="stat-card__value">{summary?.totalUsers || 0}</span><span className="stat-card__label">Total Users</span></div></div>
        <div className="stat-card stat-card--blue" onClick={() => navigate('/properties')}><div className="stat-card__icon">🏠</div><div className="stat-card__info"><span className="stat-card__value">{summary?.totalProperties || 0}</span><span className="stat-card__label">Properties</span></div></div>
        <div className="stat-card stat-card--amber" onClick={() => navigate('/agreements')}><div className="stat-card__icon">📄</div><div className="stat-card__info"><span className="stat-card__value">{summary?.pendingAgreements || 0}</span><span className="stat-card__label">Pending Agreements</span></div></div>
        <div className="stat-card stat-card--green" onClick={() => navigate('/payments')}><div className="stat-card__icon">💰</div><div className="stat-card__info"><span className="stat-card__value">ETB {Number(summary?.totalRevenue || 0).toLocaleString()}</span><span className="stat-card__label">Total Revenue</span></div></div>
      </div>

      <div className="stats-grid stats-grid--secondary">
        <div className="stat-card stat-card--teal"><div className="stat-card__icon">🔑</div><div className="stat-card__info"><span className="stat-card__value">{summary?.totalOwners || 0}</span><span className="stat-card__label">Owners</span></div></div>
        <div className="stat-card stat-card--pink"><div className="stat-card__icon">🛒</div><div className="stat-card__info"><span className="stat-card__value">{summary?.totalBuyers || 0}</span><span className="stat-card__label">Buyers</span></div></div>
        <div className="stat-card stat-card--blue"><div className="stat-card__icon">✅</div><div className="stat-card__info"><span className="stat-card__value">{summary?.publishedProperties || 0}</span><span className="stat-card__label">Published Properties</span></div></div>
        <div className="stat-card stat-card--amber"><div className="stat-card__icon">📃</div><div className="stat-card__info"><span className="stat-card__value">{summary?.completedAgreements || 0}</span><span className="stat-card__label">Completed Agreements</span></div></div>
      </div>

      <div className="dashboard__row">
        <div className="card">
          <div className="card__header"><h3>Recent Agreements</h3></div>
          <div className="card__body">
            {recentAgreements?.length > 0 ? (
              <div className="table-responsive"><table className="table"><thead><tr><th>Property</th><th>Buyer</th><th>Owner</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>{recentAgreements.map((a) => (
                  <tr key={a.id}><td>{a.property?.title || 'N/A'}</td><td>{a.buyer?.name}</td><td>{a.owner?.name}</td><td><span className={statusBadge(a.status)}>{a.status.replace('owner_', '')}</span></td><td>{new Date(a.createdAt).toLocaleDateString()}</td></tr>
                ))}</tbody></table></div>
            ) : <p className="empty-state">No recent agreements.</p>}
          </div>
        </div>
        <div className="card">
          <div className="card__header"><h3>Recent Users</h3></div>
          <div className="card__body">
            {recentUsers?.length > 0 ? (
              <div className="table-responsive"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>{recentUsers.map((u) => (
                  <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><span className="badge badge--info">{u.role}</span></td><td><span className={`badge ${u.isActive ? 'badge--success' : 'badge--danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td></tr>
                ))}</tbody></table></div>
            ) : <p className="empty-state">No recent users.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
