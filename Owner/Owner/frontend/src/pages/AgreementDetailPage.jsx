import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { agreementAPI, paymentAPI } from "../services/api";
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
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetchAgreement();
  }, [id]);

  const fetchAgreement = async () => {
    setLoading(true);
    try {
      const res = await agreementAPI.getById(id);
      const agr = res.data.data.agreement;
      setAgreement(agr);
      if (['payment_submitted','payment_confirmed','payment_verified','completed'].includes(agr.status)) {
        try { const pr = await paymentAPI.getByAgreement(id); setPayment(pr.data.data); } catch (_) {}
      }
    } catch (err) {
      alert("Failed to load agreement details.");
      navigate("/agreements");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (action) => {
    const verb = action === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this agreement?`))
      return;

    setActionLoading(true);
    try {
      await agreementAPI.respond(id, { action });
      alert(`Agreement ${verb}ed successfully!`);
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${verb}.`);
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
      await agreementAPI.respond(id, {
        action: "counter_offer",
        counterOfferPrice: parseFloat(counterPrice),
        ownerNotes: counterNotes,
      });
      alert("Counter-offer submitted successfully!");
      setCounterModal(false);
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit counter-offer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Confirm that you have received the payment from the buyer?")) return;
    setActionLoading(true);
    try {
      await agreementAPI.confirmPayment(id, { confirmed: true });
      alert("Payment confirmed! Admin will now generate the agreement PDF.");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to confirm payment.");
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
          event.actorType === "owner"
            ? { name: "You" }
            : agreement.buyer || { name: "Buyer" },
      });
    });
  } else {
    // Fallback to old logic
    timeline.push({
      type: "buyer",
      action: "requested",
      price:
        agreement.agreementType === "rental"
          ? agreement.monthlyRent
          : agreement.salePrice,
      note: agreement.terms,
      timestamp: agreement.createdAt,
      user: agreement.buyer || { name: "Buyer" },
    });

    if (agreement.counterOfferPrice) {
      timeline.push({
        type: "owner",
        action: "counter-offered",
        price: agreement.counterOfferPrice,
        note: agreement.ownerNotes,
        timestamp: agreement.ownerCounterAt || agreement.updatedAt,
        user: { name: "You" },
      });
    }

    if (agreement.buyerCounterPrice) {
      timeline.push({
        type: "buyer",
        action: "counter-offered",
        price: agreement.buyerCounterPrice,
        note: agreement.buyerNotes,
        timestamp: agreement.buyerCounterAt || agreement.updatedAt,
        user: agreement.buyer || { name: "Buyer" },
      });
    }
  }

  const canRespond =
    agreement.status === "forwarded_to_owner" ||
    agreement.status === "buyer_counter_offer" ||
    agreement.status === "buyer_counter_forwarded";

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

      {/* Property & Buyer Info */}
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
            <h3>Buyer</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>{agreement.buyer?.name || agreement.clientName}</strong>
            </p>
            <p>{agreement.buyer?.email || agreement.clientEmail}</p>
            <p>{agreement.buyer?.phone || agreement.clientPhone}</p>
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

      {/* Payment Confirmation */}
      {agreement.status === "payment_submitted" && (
        <div className="card" style={{ marginTop: "1rem", border: "2px solid #f59e0b" }}>
          <div className="card__header" style={{ background: "#fffbeb" }}>
            <h3>💳 Payment Receipt — Confirmation Required</h3>
          </div>
          <div className="card__body">
            {payment ? (
              <>
                <p><strong>Payment Method:</strong> {payment.paymentGateway}</p>
                <p><strong>Transaction ID:</strong> <code>{payment.transactionId}</code></p>
                <p><strong>Amount:</strong> ETB {Number(payment.amount).toLocaleString()}</p>
                <p><strong>Reference:</strong> {payment.referenceNumber}</p>
                <p><strong>Submitted:</strong> {new Date(payment.paidAt || payment.createdAt).toLocaleString()}</p>
                {payment.receiptUrl && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <p><strong>Receipt:</strong></p>
                    {payment.receiptUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                      <img src={payment.receiptUrl} alt="Payment receipt" style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "6px", border: "1px solid #e5e7eb", marginTop: "0.5rem" }} />
                    ) : (
                      <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--outline" style={{ marginTop: "0.5rem" }}>📎 View Receipt</a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>Loading payment details...</p>
            )}
            <p style={{ marginTop: "1rem", color: "#6b7280" }}>Please review the receipt above and confirm if you have received this payment.</p>
            <button className="btn btn--success" onClick={handleConfirmPayment} disabled={actionLoading} style={{ marginTop: "0.75rem" }}>
              {actionLoading ? "⏳ Processing..." : "✅ Confirm Payment Received"}
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
                      {event.type === "buyer" ? "Buyer" : "You (Owner)"}
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

      {/* Owner Actions */}
      {canRespond && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__header">
            <h3>⚙️ Your Response</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "1rem" }}>
              {agreement.status === "buyer_counter_offer" ||
              agreement.status === "buyer_counter_forwarded"
                ? "The buyer has made a counter-offer. How would you like to respond?"
                : "Review this agreement request and choose your response."}
            </p>
            <div className="action-buttons">
              <button
                className="btn btn--success"
                onClick={() => handleRespond("approve")}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "✓ Approve"}
              </button>
              <button
                className="btn btn--danger"
                onClick={() => handleRespond("reject")}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "✕ Reject"}
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
        agreement.status !== "payment_submitted" && (
          <div className="card" style={{ marginTop: "1rem" }}>
            <div className="card__body">
              <div className="alert alert--info">
                {agreement.status === "pending" &&
                  "This request is pending admin review."}
                {agreement.status === "counter_offer" &&
                  "Your counter-offer is pending admin review."}
                {agreement.status === "counter_offer_sent" &&
                  "Waiting for buyer response to your counter-offer..."}
                {agreement.status === "buyer_accepted_counter" &&
                  "Buyer accepted your counter-offer! Waiting for admin to finalize."}
                {agreement.status === "buyer_rejected_counter" &&
                  "Buyer rejected your counter-offer. Negotiation ended."}
                {agreement.status === "owner_rejected" &&
                  "You rejected this request."}
                {agreement.status === "payment_submitted" && ""}
                {agreement.status === "payment_confirmed" &&
                  "✅ You confirmed payment received. Admin is generating the agreement PDF."}
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
              {agreement.buyerCounterPrice && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                  }}
                >
                  <strong>Buyer's Offer:</strong> ETB{" "}
                  {Number(agreement.buyerCounterPrice).toLocaleString()}
                </div>
              )}
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
