/**
 * Agreement Requests Page (Buyer Module)
 * Simplified table with View Details button
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { agreementAPI } from "../services/api";

const AgreementRequestsPage = () => {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAgreements();
  }, [page, statusFilter]);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await agreementAPI.getAll(params);
      setAgreements(res.data.data.agreements);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error("Failed to load agreements:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: "badge--warning",
      forwarded_to_owner: "badge--info",
      counter_offer: "badge--purple",
      counter_offer_sent: "badge--purple",
      buyer_accepted_counter: "badge--success",
      buyer_rejected_counter: "badge--danger",
      buyer_counter_offer: "badge--warning",
      owner_approved: "badge--success",
      owner_rejected: "badge--danger",
      completed: "badge--info",
    };
    return `badge ${map[status] || "badge--default"}`;
  };

  const formatStatus = (status) => {
    const labels = {
      pending: "Pending",
      forwarded_to_owner: "Under Review",
      counter_offer: "Counter-Offer (Pending)",
      counter_offer_sent: "Counter-Offer Received",
      buyer_accepted_counter: "Counter-Offer Accepted",
      buyer_rejected_counter: "Counter-Offer Rejected",
      buyer_counter_offer: "Your Counter-Offer Sent",
      owner_approved: "Approved",
      owner_rejected: "Rejected",
      completed: "Completed",
    };
    return labels[status] || status.replace("_", " ");
  };

  return (
    <div className="agreements-page">
      <div className="page-header">
        <h1>My Agreement Requests</h1>
        <p>Track the status of your property agreement requests</p>
      </div>

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          id="select-status-filter"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="forwarded_to_owner">Under Review</option>
          <option value="counter_offer_sent">Counter-Offer Received</option>
          <option value="buyer_counter_offer">Your Counter-Offer Sent</option>
          <option value="buyer_accepted_counter">Counter-Offer Accepted</option>
          <option value="buyer_rejected_counter">Counter-Offer Rejected</option>
          <option value="owner_approved">Approved</option>
          <option value="owner_rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading agreements...</p>
        </div>
      ) : agreements.length === 0 ? (
        <div className="empty-state">
          <h3>No agreement requests</h3>
          <p>Browse properties and request an agreement to get started.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>PDF</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.property?.title || "N/A"}</strong>
                      <br />
                      <small>{a.property?.address || ""}</small>
                    </td>
                    <td className="capitalize">{a.agreementType}</td>
                    <td>
                      <span className={statusBadge(a.status)}>
                        {formatStatus(a.status)}
                      </span>
                    </td>
                    <td>
                      {a.pdfUrl ? (
                        <a
                          href={a.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--sm btn--outline"
                        >
                          📥 Download
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn--sm btn--primary"
                        onClick={() => navigate(`/agreements/${a.id}`)}
                      >
                        👁 View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn--outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn--outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgreementRequestsPage;
