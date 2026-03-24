/**
 * Payments Page
 * Lists all payments received by the property owner
 */
import { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAll({
        page: pagination.page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchPayments();
  };

  const handlePageChange = (newPage) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  const getStatusClass = (status) => {
    const map = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
      refunded: 'info',
    };
    return map[status] || 'info';
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="page-header__subtitle">Track all payments received for your properties</p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="filters">
          <form onSubmit={handleSearch} className="filters__search">
            <input
              type="text"
              placeholder="Search by reference or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              id="input-payment-search"
            />
            <button type="submit" className="btn btn--primary btn--sm">Search</button>
          </form>
          <div className="filters__selects">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="select"
              id="select-payment-status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>💰</span>
            <h3>No Payments Found</h3>
            <p>Payments will appear here once tenants or buyers make transactions.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table" id="table-payments">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Property</th>
                    <th>Payer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <code className="reference-code">{payment.referenceNumber || 'N/A'}</code>
                      </td>
                      <td>{payment.property?.title || 'N/A'}</td>
                      <td>
                        <div>
                          <strong>{payment.payer?.name || 'N/A'}</strong>
                          <br />
                          <small className="text-muted">{payment.payer?.email || ''}</small>
                        </div>
                      </td>
                      <td className="text-bold">ETB {Number(payment.amount).toLocaleString()}</td>
                      <td>
                        <span className="badge badge--outline">
                          {payment.paymentMethod?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${getStatusClass(payment.paymentStatus)}`}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn--sm btn--outline"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                ← Previous
              </button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                className="btn btn--sm btn--outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
