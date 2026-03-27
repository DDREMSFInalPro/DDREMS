import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { agreementAPI } from "../services/api";
import "./AgreementDetailPage.css";

const AgreementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [counterModal, setCounterModal] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  useEffect(() => {
    fetchAgreement();
  }, [id]);

  const fetchAgreement = async () => {
    setLoading(true);
    try {
      const res = await agreementAPI.getById(id);
      const agr = res.data.data.agreement;
      setAgreement(agr);
    } catch (err) {
      alert(
        `Failed to load agreement details: ${err.response?.data?.message || err.message}`,
      );
      navigate("/agreements");
    } finally {
      setLoading(false);
    }
  };

  const handleCounterResponse = async (action) => {
    const actionText = action === "accept" ? "accept" : "reject";
    if (
      !window.confirm(
        `Are you sure you want to ${actionText} this counter-offer?`,
      )
    )
      return;

    setActionLoading(true);
    try {
      const res = await agreementAPI.respondToCounter(id, { action });
      alert(`Counter-offer ${actionText}ed successfully!`);
      // Update state with the returned data
      setAgreement(res.data.data.agreement);
    } catch (err) {
      alert(
        err.response?.data?.message || `Failed to ${actionText} counter-offer.`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitCounter = async () => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      alert("Please enter a valid counter-offer price.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await agreementAPI.respondToCounter(id, {
        action: "counter_offer",
        counterOfferPrice: parseFloat(counterPrice),
        buyerNotes: counterNotes,
      });
      alert("Counter-offer submitted successfully!");
      setCounterModal(false);
      setCounterPrice("");
      setCounterNotes("");
      // Update state with the returned data
      setAgreement(res.data.data.agreement);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit counter-offer.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="page-loading">
        <div className="spinner"></div>
      </div>
    );
  if (!agreement) return null;

  // Build timeline from negotiation history
  const timeline = [];

  if (agreement.negotiationHistory && agreement.negotiationHistory.length > 0) {
    // Use negotiation history if available
    agreement.negotiationHistory.forEach((event) => {
      timeline.push({
        type: event.actorType,
        action:
          event.actionType === "initial_request"
            ? "requested"
            : "counter-offered",
        price: event.price,
        note: event.notes,
        timestamp: event.createdAt,
        user:
          event.actorType === "buyer"
            ? { name: "You" }
            : agreement.ownerUser || { name: "Owner" },
      });
    });
  } else {
    // Fallback to old logic if no history
    timeline.push({
      type: "buyer",
      action: "requested",
      price:
        agreement.agreementType === "rental"
          ? agreement.monthlyRent
          : agreement.salePrice,
      note: agreement.terms,
      timestamp: agreement.createdAt,
      user: { name: "You" },
    });

    if (agreement.counterOfferPrice) {
      timeline.push({
        type: "owner",
        action: "counter-offered",
        price: agreement.counterOfferPrice,
        note: agreement.ownerNotes,
        timestamp: agreement.ownerCounterAt || agreement.updatedAt,
        user: agreement.ownerUser || { name: "Owner" },
      });
    }

    if (agreement.buyerCounterPrice) {
      timeline.push({
        type: "buyer",
        action: "counter-offered",
        price: agreement.buyerCounterPrice,
        note: agreement.buyerNotes,
        timestamp: agreement.buyerCounterAt || agreement.updatedAt,
        user: { name: "You" },
      });
    }
  }

  const canRespond = agreement.status === "counter_offer_sent";

  return (
    <div className="agreement-detail-page">
      <div className="page-header">
        <button
          className="btn btn--outline"
          onClick={() => navigate("/agreements")}
        >
          ← Back
        </button>
        <div>
          <h1>Agreement Details</h1>
          <p>ID: {agreement.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Property Info */}
      <div className="agreement-info-grid">
        <div className="card">
          <div className="card__header">
            <h3>Property</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>{agreement.property?.title}</strong>
            </p>
            <p>{agreement.property?.address}</p>
            <p>Type: {agreement.agreementType}</p>
            <p>
              Listed Price: ETB{" "}
              {Number(agreement.property?.price).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3>Status</h3>
          </div>
          <div className="card__body">
            <p>
              <span
                className={`badge badge--${agreement.status.includes("approved") ? "success" : agreement.status.includes("rejected") ? "danger" : "warning"}`}
              >
                {agreement.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </p>
            <p>Created: {new Date(agreement.createdAt).toLocaleString()}</p>
            {agreement.pdfUrl && (
              <a
                href={agreement.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm btn--primary"
              >
                📥 Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Formal Agreement Section - shown when price is agreed or owner approved */}
      {(agreement.status === "owner_approved" ||
        agreement.status === "price_agreed") && (
        <div
          className="card"
          style={{ marginTop: "1rem", border: "2px solid #3b82f6" }}
        >
          <div className="card__header" style={{ background: "#eff6ff" }}>
            <h3>📋 Formal Agreement</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "1rem" }}>
              {agreement.status === "price_agreed"
                ? "The price has been agreed and a formal agreement has been created by the admin."
                : "The owner has approved. The admin will create a formal agreement for signing and payment."}
            </p>
            <button
              className="btn btn--primary"
              onClick={() => navigate(`/agreements/${agreement.id}/formal`)}
            >
              View Formal Agreement ✍️
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card__header">
          <h3>💬 Negotiation Timeline</h3>
        </div>
        <div className="card__body">
          <div className="timeline">
            {timeline.map((event, index) => (
              <div
                key={index}
                className={`timeline-event timeline-event--${event.type} ${index === timeline.length - 1 ? "timeline-event--latest" : ""}`}
              >
                <div className="timeline-event__avatar">
                  {event.type === "buyer" ? "👤" : "🏠"}
                </div>
                <div className="timeline-event__content">
                  <div className="timeline-event__header">
                    <strong>{event.user?.name}</strong>
                    <span className="timeline-event__role">
                      {event.type === "buyer" ? "You (Buyer)" : "Owner"}
                    </span>
                  </div>
                  <div className="timeline-event__action">
                    {event.action === "requested"
                      ? "Requested Agreement"
                      : "Made Counter-Offer"}
                  </div>
                  <div className="timeline-event__price">
                    💰 ETB {Number(event.price).toLocaleString()}
                  </div>
                  {event.note && (
                    <div className="timeline-event__note">"{event.note}"</div>
                  )}
                  <div className="timeline-event__timestamp">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buyer Actions */}
      {canRespond && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__header">
            <h3>⚙️ Your Response</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "1rem" }}>
              The owner has made a counter-offer. How would you like to respond?
            </p>
            <div className="action-buttons">
              <button
                className="btn btn--success"
                onClick={() => handleCounterResponse("accept")}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "✓ Accept Offer"}
              </button>
              <button
                className="btn btn--danger"
                onClick={() => handleCounterResponse("reject")}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "✕ Reject Offer"}
              </button>
              <button
                className="btn btn--warning"
                onClick={() => setCounterModal(true)}
                disabled={actionLoading}
              >
                💰 Make Counter-Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {!canRespond &&
        agreement.status !== "completed" &&
        agreement.status !== "owner_approved" &&
        agreement.status !== "price_agreed" &&
        agreement.status !== "payment_submitted" &&
        agreement.status !== "payment_confirmed" && (
          <div className="card" style={{ marginTop: "1rem" }}>
            <div className="card__body">
              <div className="alert alert--info">
                {agreement.status === "pending" &&
                  "Your request is pending admin review."}
                {agreement.status === "forwarded_to_owner" &&
                  "Waiting for owner response..."}
                {agreement.status === "counter_offer" &&
                  "Owner made a counter-offer. Waiting for admin to forward it to you..."}
                {agreement.status === "buyer_counter_offer" &&
                  "Your counter-offer has been sent to admin for review. They will forward it to the owner."}
                {agreement.status === "buyer_counter_forwarded" &&
                  "Your counter-offer has been forwarded to the owner. Waiting for their response..."}
                {agreement.status === "buyer_accepted_counter" &&
                  "You accepted the counter-offer. Waiting for admin to finalize the agreement."}
                {agreement.status === "buyer_rejected_counter" &&
                  "You rejected the counter-offer. Negotiation ended."}
                {agreement.status === "owner_rejected" &&
                  "The owner rejected your request."}
                {agreement.status === "payment_submitted" &&
                  "✅ Payment submitted. Admin is verifying and will ask the owner to confirm receipt."}
                {agreement.status === "payment_confirmed" &&
                  "✅ Owner confirmed payment received. Admin is verifying..."}
                {agreement.status === "payment_verified" &&
                  "✅ Payment verified by admin. Agreement PDF is being generated."}
                {agreement.status === "price_agreed" && (
                  <span>
                    Price agreed. Admin has created a formal agreement.{" "}
                    <button
                      className="btn btn--sm btn--primary"
                      style={{ marginLeft: "0.5rem" }}
                      onClick={() =>
                        navigate(`/agreements/${agreement.id}/formal`)
                      }
                    >
                      View Formal Agreement ✍️
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Formal Agreement link when owner_approved (formal agreement may exist) */}
      {agreement.status === "owner_approved" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__body">
            <div className="alert alert--info">
              <span>
                The owner has approved. Check if a formal agreement has been
                created.{" "}
                <button
                  className="btn btn--sm btn--outline"
                  style={{ marginLeft: "0.5rem" }}
                  onClick={() => navigate(`/agreements/${agreement.id}/formal`)}
                >
                  View Formal Agreement
                </button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Counter-Offer Modal */}
      {counterModal && (
        <div className="modal-overlay" onClick={() => setCounterModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>💰 Make Counter-Offer</h2>
              <button
                className="modal__close"
                onClick={() => setCounterModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                <strong>Owner's Offer:</strong> ETB{" "}
                {Number(agreement.counterOfferPrice).toLocaleString()}
              </div>
              <div className="form-group">
                <label>Your Counter-Offer Price (ETB) *</label>
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
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--outline"
                onClick={() => setCounterModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={handleSubmitCounter}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Submitting..." : "💰 Submit Counter-Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementDetailPage;
