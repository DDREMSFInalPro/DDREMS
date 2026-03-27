/**
 * Agreement Page
 * View incoming agreement requests and approve/reject them
 * Workflow: buyer requests → admin forwards → owner approves/rejects → admin generates PDF
 */
import { useState, useEffect } from "react";
import { agreementAPI } from "../services/api";

const STATUS_CONFIG = {
  pending: { label: "Awaiting Admin Review", badge: "default", icon: "📋" },
  forwarded_to_owner: {
    label: "Pending Your Review",
    badge: "warning",
    icon: "⏳",
  },
  counter_offer: { label: "Counter-Offer Sent", badge: "purple", icon: "💰" },
  counter_offer_sent: {
    label: "Counter-Offer Delivered",
    badge: "purple",
    icon: "📨",
  },
  buyer_accepted_counter: {
    label: "Buyer Accepted",
    badge: "success",
    icon: "✅",
  },
  buyer_rejected_counter: {
    label: "Buyer Rejected",
    badge: "danger",
    icon: "❌",
  },
  buyer_counter_offer: {
    label: "Buyer Counter-Offer",
    badge: "warning",
    icon: "💰",
  },
  owner_approved: { label: "Approved", badge: "success", icon: "✅" },
  owner_rejected: { label: "Rejected", badge: "danger", icon: "❌" },
  completed: { label: "Completed", badge: "info", icon: "📄" },
};

const AgreementPage = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [counterOfferModal, setCounterOfferModal] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      const res = await agreementAPI.getAll(params);
      setAgreements(res.data.data.agreements);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load agreements.");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, action) => {
    const verb = action === "approve" ? "approve" : "reject";
    if (
      !window.confirm(
        `Are you sure you want to ${verb} this agreement request?`,
      )
    )
      return;

    setActionLoading(id);
    setError("");
    setSuccess("");
    try {
      const res = await agreementAPI.respond(id, { action });
      setSuccess(res.data.message);
      fetchAgreements();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${verb} request.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterOffer = async () => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      setError("Please enter a valid counter-offer price.");
      return;
    }
    setActionLoading(counterOfferModal);
    setError("");
    setSuccess("");
    try {
      const res = await agreementAPI.respond(counterOfferModal, {
        action: "counter_offer",
        counterOfferPrice: parseFloat(counterPrice),
        ownerNotes: counterNotes,
      });
      setSuccess(res.data.message);
      setCounterOfferModal(null);
      setCounterPrice("");
      setCounterNotes("");
      fetchAgreements();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit counter-offer.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = agreements.filter(
    (a) =>
      a.status === "forwarded_to_owner" || a.status === "buyer_counter_offer",
  );
  const filteredAgreements =
    filter === "all"
      ? agreements.filter(
          (a) =>
            a.status !== "forwarded_to_owner" &&
            a.status !== "buyer_counter_offer",
        )
      : agreements.filter(
          (a) =>
            a.status === filter &&
            a.status !== "forwarded_to_owner" &&
            a.status !== "buyer_counter_offer",
        );

  const openCounterOffer = (a) => {
    setCounterOfferModal(a.id);
    setCounterPrice(
      a.agreementType === "rental"
        ? a.monthlyRent || ""
        : a.salePrice || a.property?.price || "",
    );
    setCounterNotes("");
  };

  if (loading)
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="agreement-page">
      <div className="page-header">
        <div>
          <h1>Agreements</h1>
          <p className="page-header__subtitle">
            Review buyer requests and manage agreements
          </p>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      {/* Workflow Info Banner */}
      <div className="workflow-banner">
        <div className="workflow-banner__icon">📋</div>
        <div className="workflow-banner__content">
          <strong>How it works:</strong> When a buyer requests an agreement, the
          property administrator forwards the request to you for review. Accept
          or reject the request below. Once approved, the administrator will
          generate the official agreement document.
        </div>
      </div>

      {/* Pending Requests Section */}
      <div className="agreement-section">
        <div className="card">
          <div className="card__header">
            <h3>
              ⏳ Incoming Requests (Forwarded by Admin){" "}
              {pendingRequests.length > 0 && (
                <span
                  className="badge badge--warning"
                  style={{ marginLeft: "0.5rem" }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </h3>
          </div>
          <div className="card__body">
            {pendingRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending agreement requests.</p>
              </div>
            ) : (
              <div className="agreement-request-list">
                {pendingRequests.map((a) => (
                  <div key={a.id} className="agreement-request-card">
                    <div className="agreement-request-card__header">
                      <div className="agreement-request-card__property">
                        <strong>{a.property?.title || "Property"}</strong>
                        <span
                          className={`badge badge--${a.agreementType === "sale" ? "purple" : "info"}`}
                        >
                          {a.agreementType}
                        </span>
                        <span className="reference-code">
                          ID: {a.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <span className="badge badge--warning">
                        ⏳ Awaiting Your Response
                      </span>
                    </div>

                    <div className="agreement-request-card__body">
                      <div className="agreement-request-card__detail-grid">
                        <div className="agreement-request-card__detail">
                          <span className="agreement-request-card__label">
                            Buyer
                          </span>
                          <span className="agreement-request-card__value">
                            {a.buyer?.name || a.clientName}
                          </span>
                        </div>
                        <div className="agreement-request-card__detail">
                          <span className="agreement-request-card__label">
                            Email
                          </span>
                          <span className="agreement-request-card__value">
                            {a.buyer?.email || a.clientEmail || "—"}
                          </span>
                        </div>
                        <div className="agreement-request-card__detail">
                          <span className="agreement-request-card__label">
                            Phone
                          </span>
                          <span className="agreement-request-card__value">
                            {a.buyer?.phone || a.clientPhone || "—"}
                          </span>
                        </div>
                        <div className="agreement-request-card__detail">
                          <span className="agreement-request-card__label">
                            Property Address
                          </span>
                          <span className="agreement-request-card__value">
                            {a.property?.address || "—"}
                          </span>
                        </div>
                        {a.agreementType === "rental" && a.monthlyRent && (
                          <div className="agreement-request-card__detail">
                            <span className="agreement-request-card__label">
                              Monthly Rent
                            </span>
                            <span className="agreement-request-card__value">
                              ETB {Number(a.monthlyRent).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {a.agreementType === "sale" && a.salePrice && (
                          <div className="agreement-request-card__detail">
                            <span className="agreement-request-card__label">
                              Sale Price
                            </span>
                            <span className="agreement-request-card__value">
                              ETB {Number(a.salePrice).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      {a.terms && (
                        <div className="agreement-request-card__terms">
                          <span className="agreement-request-card__label">
                            Terms
                          </span>
                          <p>{a.terms}</p>
                        </div>
                      )}
                      {a.adminNotes && (
                        <div className="agreement-request-card__admin-note">
                          <strong>Admin Note:</strong> {a.adminNotes}
                        </div>
                      )}
                      {a.status === "buyer_counter_offer" &&
                        a.buyerCounterPrice && (
                          <div
                            className="agreement-request-card__admin-note"
                            style={{
                              background: "#e3f2fd",
                              borderLeft: "3px solid #2196f3",
                            }}
                          >
                            <strong>💰 Buyer's Counter-Offer:</strong> ETB{" "}
                            {Number(a.buyerCounterPrice).toLocaleString()}
                            {a.buyerNotes && (
                              <div
                                style={{
                                  marginTop: "0.5rem",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {a.buyerNotes}
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="agreement-request-card__footer">
                      <span
                        className="text-muted"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Requested {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                      <div className="agreement-request-card__actions">
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleRespond(a.id, "reject")}
                          disabled={actionLoading === a.id}
                          id={`btn-reject-${a.id}`}
                        >
                          {actionLoading === a.id ? "..." : "✕ Reject"}
                        </button>
                        <button
                          className="btn btn--warning btn--sm"
                          onClick={() => openCounterOffer(a)}
                          disabled={actionLoading === a.id}
                          id={`btn-counter-${a.id}`}
                        >
                          💰 Counter-Offer
                        </button>
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => handleRespond(a.id, "approve")}
                          disabled={actionLoading === a.id}
                          id={`btn-approve-${a.id}`}
                        >
                          {actionLoading === a.id ? "..." : "✓ Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Agreements Section */}
      <div className="agreement-section">
        <div className="card">
          <div className="card__header">
            <h3>📑 Agreement History</h3>
            <div className="agreement-filters">
              {[
                "all",
                "pending",
                "owner_approved",
                "owner_rejected",
                "completed",
              ].map((f) => (
                <button
                  key={f}
                  className={`btn btn--sm ${filter === f ? "btn--primary" : "btn--outline"}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : STATUS_CONFIG[f]?.label || f}
                </button>
              ))}
            </div>
          </div>
          <div className="card__body">
            {filteredAgreements.length === 0 ? (
              <div className="empty-state">
                <p>No agreements found.</p>
              </div>
            ) : (
              <div className="agreement-list">
                {filteredAgreements.map((a) => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={a.id} className="agreement-item">
                      <div className="agreement-item__info">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <strong>{a.property?.title || "Property"}</strong>
                          <span
                            className={`badge badge--${a.agreementType === "sale" ? "purple" : "info"}`}
                          >
                            {a.agreementType}
                          </span>
                        </div>
                        <span className={`badge badge--${cfg.badge}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div className="agreement-item__details">
                        <span>Client: {a.buyer?.name || a.clientName}</span>
                        <span>
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {a.pdfUrl && a.status === "completed" && (
                        <a
                          href={a.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--sm btn--outline"
                        >
                          📥 Download
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Counter-Offer Modal */}
      {counterOfferModal && (
        <div
          className="modal-overlay"
          onClick={() => setCounterOfferModal(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>💰 Make Counter-Offer</h2>
              <button
                className="modal__close"
                onClick={() => setCounterOfferModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Counter-Offer Price (ETB) *</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Enter your counter-offer price"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  rows={3}
                  placeholder="Explain your counter-offer..."
                />
              </div>
              <div className="modal__footer">
                <button
                  className="btn btn--outline"
                  onClick={() => setCounterOfferModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--primary"
                  onClick={handleCounterOffer}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "⏳ Submitting..."
                    : "💰 Submit Counter-Offer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementPage;
