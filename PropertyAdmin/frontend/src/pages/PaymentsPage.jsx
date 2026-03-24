import { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ paymentStatus: '', search: '', page: 1 });

  useEffect(() => { fetchPayments(); }, [filters.page, filters.paymentStatus]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.search) params.search = filters.search;
      const res = await paymentAPI.getAll(params);
      setPayments(res.data.data.payments);
      setPagination(res.data.data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge--warning', completed: 'badge--success', failed: 'badge--danger', refunded: 'badge--info' };
    return `badge ${map[status] || 'badge--default'}`;
  };

  return (
    <div className="payments-page">
      <div className="page-header"><h1>Payment Management</h1><p>All system payments</p></div>
      <div className="toolbar">
        <form onSubmit={(e) => { e.preventDefault(); fetchPayments(); }} className="toolbar__search">
          <input type="text" placeholder="Search by reference..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <button type="submit" className="btn btn--primary btn--sm">Search</button>
        </form>
        <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}>
          <option value="">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
        </select>
      </div>
      {loading ? <div className="loading-screen"><div className="spinner"></div></div> : payments.length === 0 ? <div className="empty-state"><h3>No payments found</h3></div> : (
        <>
          <div className="table-responsive"><table className="table"><thead><tr><th>Reference</th><th>Property</th><th>Buyer</th><th>Owner</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{payments.map((p) => (
              <tr key={p.id}><td><code>{p.referenceNumber || '—'}</code></td><td>{p.property?.title || 'N/A'}</td><td>{p.buyer?.name}</td><td>{p.owner?.name}</td><td><strong>ETB {Number(p.amount).toLocaleString()}</strong></td><td className="capitalize">{p.paymentMethod?.replace('_', ' ')}</td><td><span className={statusBadge(p.paymentStatus)}>{p.paymentStatus}</span></td><td>{new Date(p.createdAt).toLocaleDateString()}</td></tr>
            ))}</tbody></table></div>
          {pagination.totalPages > 1 && <div className="pagination"><button className="btn btn--outline" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button><span className="pagination__info">Page {pagination.page} of {pagination.totalPages}</span><button className="btn btn--outline" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button></div>}
        </>
      )}
    </div>
  );
};

export default PaymentsPage;
