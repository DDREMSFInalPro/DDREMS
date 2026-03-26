/**
 * Dashboard Page
 * Owner dashboard with summary stats and recent activity
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getSummary();
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn--primary" onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  const { summary, recentPayments, recentProperties, propertiesByStatus } = data || {};

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-header__subtitle">Overview of your real estate portfolio</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon">🏠</div>
          <div className="stat-card__content">
            <span className="stat-card__value">{summary?.totalProperties || 0}</span>
            <span className="stat-card__label">Total Properties</span>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-card__icon">📢</div>
          <div className="stat-card__content">
            <span className="stat-card__value">{summary?.activeListings || 0}</span>
            <span className="stat-card__label">Active Listings</span>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon">💰</div>
          <div className="stat-card__content">
            <span className="stat-card__value">{summary?.totalPayments || 0}</span>
            <span className="stat-card__label">Total Payments</span>
          </div>
        </div>
        <div className="stat-card stat-card--orange">
          <div className="stat-card__icon">💵</div>
          <div className="stat-card__content">
            <span className="stat-card__value">
              ETB {(summary?.totalRevenue || 0).toLocaleString()}
            </span>
            <span className="stat-card__label">Total Revenue</span>
          </div>
        </div>
      </div>

      {/* Two-column layout for recent data */}
      <div className="dashboard__grid">
        {/* Recent Properties */}
        <div className="card">
          <div className="card__header">
            <h3>Recent Properties</h3>
            <Link to="/properties" className="btn btn--sm btn--outline">View All</Link>
          </div>
          <div className="card__body">
            {recentProperties && recentProperties.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProperties.map((prop) => (
                    <tr key={prop.id}>
                      <td>
                        <Link to={`/properties/edit/${prop.id}`} className="text-link">
                          {prop.title}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge--info">{prop.propertyType}</span>
                      </td>
                      <td>ETB {Number(prop.price).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge--${prop.isPublished ? 'success' : 'warning'}`}>
                          {prop.isPublished ? 'Published' : prop.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No properties yet.</p>
                <Link to="/properties/new" className="btn btn--primary btn--sm">
                  Add Your First Property
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card__header">
            <h3>Recent Payments</h3>
            <Link to="/payments" className="btn btn--sm btn--outline">View All</Link>
          </div>
          <div className="card__body">
            {recentPayments && recentPayments.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>From</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((pay) => (
                    <tr key={pay.id}>
                      <td>{pay.property?.title || 'N/A'}</td>
                      <td>{pay.payer?.name || 'N/A'}</td>
                      <td>ETB {Number(pay.amount).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge--${pay.paymentStatus === 'completed' ? 'success' : 'warning'}`}>
                          {pay.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No payments received yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties by Status */}
      {propertiesByStatus && propertiesByStatus.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card__header">
            <h3>Properties by Status</h3>
          </div>
          <div className="card__body">
            <div className="status-bar-grid">
              {propertiesByStatus.map((item) => (
                <div key={item.status} className="status-bar-item">
                  <span className="status-bar-item__label">{item.status}</span>
                  <div className="status-bar-item__bar">
                    <div
                      className={`status-bar-item__fill status-bar-item__fill--${item.status}`}
                      style={{
                        width: `${Math.min((parseInt(item.count) / (summary?.totalProperties || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="status-bar-item__count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
