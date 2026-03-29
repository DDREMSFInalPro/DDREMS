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
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("chapa"); // "chapa" | "manual"
  const [paymentForm, setPaymentForm] = useState({ gateway: "", transactionId: "", amount: "", notes: "" });
  const [receiptFile, setReceiptFile] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);

  useEffect(() => {
    fetchAgreement();
  }, [id]);

  const fetchAgreement = async () => {
    setLoading(true);
    try {
      const res = await agreementAPI.getById(id);
      const agr = res.data.data?.agreement || res.data.data;
      if (!agr) throw new Error("Agreement data not found in response");
      setAgreement(agr);
      // Fetch existing payment if applicable
      if (['owner_approved','payment_submitted','payment_confirmed','payment_verified','completed'].includes(agr.status)) {
        try {
          const pr = await paymentAPI.getByAgreement(id);
          setExistingPayment(pr.data.data || null);
        } catch (_) {
          setExistingPayment(null);
        }
      }
      // Redirect to payments page after owner confirms
      if (agr.status === 'payment_confirmed') {
        navigate('/payments', { state: { message: '✅ Owner confirmed your payment! Your transaction is now being verified by admin.' } });
        return;
      }
    } catch (err) {
      console.error("Agreement load error:", err);
      alert(`Failed to load agreement details: ${err.response?.data?.message || err.message}`);
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

  const handleSubmitPayment = async () => {
    const amount = agreement.counterOfferPrice ||
      (agreement.agreementType === 'rental' ? agreement.monthlyRent : agreement.salePrice) ||
      agreement.property?.price;

    if (paymentMethod === "chapa") {
      setActionLoading(true);
      try {
        const res = await paymentAPI.initializeChapa({ agreementId: id, amount });
        window.location.href = res.data.data.checkoutUrl;
      } catch (err) {
        alert(err.response?.data?.message || "Failed to initialize Chapa payment.");
        setActionLoading(false);
      }
      return;
    }

    // Manual payment
    const { gateway, transactionId } = paymentForm;
    if (!gateway || !transactionId) {
      alert("Please select a bank and enter the transaction ID.");
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("agreementId", id);
      formData.append("paymentGateway", gateway);
      formData.append("transactionId", transactionId);
      formData.append("amount", amount);
      formData.append("notes", paymentForm.notes);
      if (receiptFile) formData.append("receipt", receiptFile);
      const res = await paymentAPI.submit(formData);
      alert("Payment submitted successfully! Awaiting admin verification.");
      setPaymentModal(false);
      setExistingPayment(res.data.data);
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit payment.");
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

      {/* Payment Section */}
      {(agreement.status === "owner_approved" || agreement.status === "buyer_accepted_counter") && !existingPayment && (
        <div className="card" style={{ marginTop: "1rem", border: "2px solid #f59e0b" }}>
          <div className="card__header" style={{ background: "#fffbeb" }}>
            <h3>💳 Payment Required</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "0.75rem" }}>
              ✅ <strong>The owner has approved your agreement.</strong> Please submit your payment to proceed.
            </p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981", marginBottom: "1rem" }}>
              Amount Due: ETB {Number(
                agreement.counterOfferPrice ||
                (agreement.agreementType === 'rental' ? agreement.monthlyRent : agreement.salePrice) ||
                agreement.property?.price || 0
              ).toLocaleString()}
              {agreement.agreementType === 'rental' && <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 400 }}> /month</span>}
            </p>
            <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Accepted Payment Methods:</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {["🟢 Chapa", "🏦 CBE", "🏦 Abyssinia", "🏦 Awash"].map((gw) => (
                <span key={gw} style={{ padding: "0.4rem 1rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "#f9fafb", fontWeight: 500 }}>{gw}</span>
              ))}
            </div>
            <button className="btn btn--primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }} onClick={() => setPaymentModal(true)}>
              💳 Submit Payment
            </button>
          </div>
        </div>
      )}

      {existingPayment && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__header"><h3>💳 Payment Details</h3></div>
          <div className="card__body">
            <p><strong>Gateway:</strong> {existingPayment.paymentGateway}</p>
            <p><strong>Transaction ID:</strong> <code>{existingPayment.transactionId}</code></p>
            <p><strong>Amount:</strong> ETB {Number(existingPayment.amount).toLocaleString()}</p>
            <p><strong>Reference:</strong> {existingPayment.referenceNumber}</p>
            <p><strong>Status:</strong> <span className={`badge badge--${existingPayment.paymentStatus === 'completed' ? 'success' : 'warning'}`}>{existingPayment.paymentStatus}</span></p>
            {existingPayment.receiptUrl && (
              <a href={existingPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--outline" style={{ marginTop: "0.5rem" }}>📎 View Receipt</a>
            )}
            {existingPayment.ownerConfirmed && <p style={{ color: "green", marginTop: "0.5rem" }}>✅ Owner confirmed payment received</p>}
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
              </div>
            </div>
          </div>
        )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>💳 Submit Payment</h2>
              <button className="modal__close" onClick={() => setPaymentModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <p style={{ marginBottom: "1rem" }}>
                <strong>Amount Due: ETB {Number(
                  agreement.counterOfferPrice ||
                  (agreement.agreementType === 'rental' ? agreement.monthlyRent : agreement.salePrice) ||
                  agreement.property?.price
                ).toLocaleString()}</strong>
                {agreement.agreementType === 'rental' && <span style={{ color: '#6b7280', fontSize: '0.85rem' }}> /month</span>}
              </p>

              {/* Payment method selector */}
              <div className="form-group">
                <label>Payment Method</label>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("chapa")}
                    style={{
                      flex: 1, padding: "0.75rem", border: `2px solid ${paymentMethod === "chapa" ? "#6366f1" : "#e2e8f0"}`,
                      borderRadius: "8px", background: paymentMethod === "chapa" ? "#eef2ff" : "#fff",
                      cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    🟢 Chapa (Telebirr, CBE, Cards)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("manual")}
                    style={{
                      flex: 1, padding: "0.75rem", border: `2px solid ${paymentMethod === "manual" ? "#6366f1" : "#e2e8f0"}`,
                      borderRadius: "8px", background: paymentMethod === "manual" ? "#eef2ff" : "#fff",
                      cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    🏦 Manual Bank Transfer
                  </button>
                </div>
              </div>

              {paymentMethod === "chapa" && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "1rem", marginTop: "1rem" }}>
                  <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>✅ Pay securely via Chapa</p>
                  <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    Supports: Telebirr, CBE Birr, Amole, HelloCash, Debit/Credit Cards
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    You will be redirected to Chapa's secure checkout page.
                  </p>
                </div>
              )}

              {paymentMethod === "manual" && (
                <>
                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label>Bank / Gateway *</label>
                    <select value={paymentForm.gateway} onChange={(e) => setPaymentForm({ ...paymentForm, gateway: e.target.value })}>
                      <option value="">Select bank</option>
                      <option value="CBE">CBE (Commercial Bank of Ethiopia)</option>
                      <option value="Abyssinia">Bank of Abyssinia</option>
                      <option value="Awash">Awash Bank</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transaction ID *</label>
                    <input type="text" value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} placeholder="Enter transaction/reference ID from your bank" />
                  </div>
                  <div className="form-group">
                    <label>Upload Receipt (optional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files[0])} />
                  </div>
                  <div className="form-group">
                    <label>Notes (optional)</label>
                    <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} placeholder="Any additional notes..." />
                  </div>
                </>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setPaymentModal(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSubmitPayment} disabled={actionLoading}>
                {actionLoading ? "⏳ Processing..." : paymentMethod === "chapa" ? "🟢 Pay with Chapa" : "💳 Submit Payment"}
              </button>
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
