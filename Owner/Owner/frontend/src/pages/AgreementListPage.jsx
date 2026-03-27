/**
 * Agreement List Page (Owner Module)
 * Simplified table view with View Details button
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { agreementAPI } from "../services/api";

const AgreementListPage = () => {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const res = await agreementAPI.getAll({ limit: 50 });
      setAgreements(res.data.data.agreements);
    } catch (err) {
      console.error("Failed to load agreements:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: "badge--default",
      forwarded_to_owner: "badge--warning",
      counter_offer: "badge--purple",
      counter_offer_sent: "badge--purple",
      buyer_accepted_counter: "badge--success",
      buyer_rejected_counter: "badge--danger",
      buyer_counter_offer: "badge--warning",
      owner_approved: "badge--success",
      owner_rejected: "badge--danger",
      price_agreed: "badge--info",
      payment_submitted: "badge--warning",
      payment_confirmed: "badge--info",
      payment_verified: "badge--info",
      completed: "badge--success",
    };
    return `badge ${map[status] || "badge--default"}`;
  };

  const formatStatus = (status) => {
    const labels = {
      pending: "Awaiting Admin",
      forwarded_to_owner: "Pending Your Review",
      counter_offer: "Counter-Offer Sent",
      counter_offer_sent: "Counter-Offer Delivered",
      buyer_accepted_counter: "Buyer Accepted",
      buyer_rejected_counter: "Buyer Rejected",
      buyer_counter_offer: "Buyer Counter-Offer",
      owner_approved: "Approved",
      owner_rejected: "Rejected",
      price_agreed: "Formal Agreement — Sign Required",
      payment_submitted: "Payment Submitted",
      payment_confirmed: "Payment Confirmed",
      payment_verified: "Payment Verified",
      completed: "Completed",
    };
    return labels[status] || status.replace(/_/g, " ");
  };

  const pendingCount = agreements.filter(
    (a) =>
      a.status === "forwarded_to_owner" ||
      a.status === "buyer_counter_offer" ||
      a.status === "price_agreed",
  ).length;

  const filteredAgreements =
    filter === "all"
      ? agreements
      : filter === "pending"
        ? agreements.filter(
            (a) =>
              a.status === "forwarded_to_owner" ||
              a.status === "buyer_counter_offer" ||
              a.status === "price_agreed",
          )
        : agreements.filter((a) => a.status === filter);

  if (loading)
    return (
      <div className="page-loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="agreement-page">
      <div className="page-header">
        <div>
          <h1>Agreements</h1>
          <p>Review buyer requests and manage agreements</p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="alert alert--warning" style={{ marginBottom: "1rem" }}>
          ⏳ You have {pendingCount} agreement{pendingCount > 1 ? "s" : ""}{" "}
          awaiting your response!
        </div>
      )}

      <div className="toolbar">
        <div className="button-group">
          <button
            className={`btn ${filter === "all" ? "btn--primary" : "btn--outline"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`btn ${filter === "pending" ? "btn--primary" : "btn--outline"}`}
            onClick={() => setFilter("pending")}
          >
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            className={`btn ${filter === "owner_approved" ? "btn--primary" : "btn--outline"}`}
            onClick={() => setFilter("owner_approved")}
          >
            Approved
          </button>
          <button
            className={`btn ${filter === "completed" ? "btn--primary" : "btn--outline"}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {filteredAgreements.length === 0 ? (
        <div className="empty-state">
          <h3>No agreements found</h3>
          <p>Agreements will appear here when buyers request them.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Buyer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgreements.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.property?.title || "N/A"}</strong>
                    <br />
                    <small>{a.property?.address}</small>
                  </td>
                  <td>
                    {a.buyer?.name || a.clientName}
                    <br />
                    <small>{a.buyer?.email || a.clientEmail}</small>
                  </td>
                  <td className="capitalize">{a.agreementType}</td>
                  <td>
                    <span className={statusBadge(a.status)}>
                      {formatStatus(a.status)}
                    </span>
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
      )}
    </div>
  );
};

export default AgreementListPage;
