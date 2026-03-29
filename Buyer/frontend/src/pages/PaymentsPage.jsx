/**
 * Payments Page (Buyer Module)
 * Payment history table
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { paymentAPI } from '../services/api';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const location = useLocation();
  const successMessage = location.state?.message;

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getAll({ page, limit: 10 });
      setPayments(res.data.data.payments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'badge--warning',
      completed: 'badge--success',
      failed: 'badge--danger',
      refunded: 'badge--info',
    };
    return `badge ${map[status] || 'badge--default'}`;
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>My Payments</h1>
        <p>View your payment history</p>
      </div>

      {successMessage && (
        <div className="alert alert--success" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: '10px', background: '#d1fae5', color: '#065f46', fontWeight: 500 }}>
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div><p>Loading payments...</p></div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <h3>No payments yet</h3>
          <p>Your payment history will appear here.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.referenceNumber || '—'}</code></td>
                    <td>{p.property?.title || 'N/A'}</td>
                    <td><strong>ETB {Number(p.amount).toLocaleString()}</strong></td>
                    <td className="capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                    <td><span className={statusBadge(p.paymentStatus)}>{p.paymentStatus}</span></td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn--outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="pagination__info">Page {pagination.page} of {pagination.totalPages}</span>
              <button className="btn btn--outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
