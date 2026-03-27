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
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetchAgreement();
  }, [id]);

  const fetchAgreement = async () => {
    setLoading(true);
    try {
      const res = await agreementAPI.getById(id);
      setAgreement(res.data.data);
      // Fetch payment if applicable
      if (
        [
          "payment_submitted",
          "payment_confirmed",
          "payment_verified",
          "completed",
        ].includes(res.data.data.status)
      ) {
        try {
          const pr = await agreementAPI.getPayment(id);
          setPayment(pr.data.data);
        } catch (_) {}
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Failed to load agreement details: ${msg}`);
      navigate("/agreements");
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToOwner = async () => {
    if (!window.confirm("Forward this agreement to the owner?")) return;
    setActionLoading(true);
    try {
      await agreementAPI.forwardToOwner(id, {});
      alert("Agreement forwarded to owner!");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to forward.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCounterToBuyer = async () => {
    if (!window.confirm("Send owner counter-offer to buyer?")) return;
    setActionLoading(true);
    try {
      await agreementAPI.sendCounterOfferToBuyer(id, {});
      alert("Counter-offer sent to buyer!");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForwardBuyerCounter = async () => {
    if (!window.confirm("Forward buyer counter-offer to owner?")) return;
    setActionLoading(true);
    try {
      await agreementAPI.forwardBuyerCounterToOwner(id, {});
      alert("Buyer counter-offer forwarded to owner!");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to forward.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveBuyerAcceptance = async () => {
    if (
      !window.confirm(
        "Approve this agreement? Buyer accepted the counter-offer.",
      )
    )
      return;
    setActionLoading(true);
    try {
      await agreementAPI.approveBuyerAcceptance(id, {});
      alert("Agreement approved!");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!window.confirm("Verify this payment and allow PDF generation?"))
      return;
    setActionLoading(true);
    try {
      const res = await agreementAPI.verifyPayment(id);
      alert("Payment verified! You can now generate the agreement PDF.");
      if (res.data.data?.receiptPdfUrl) {
        setPayment((p) => ({
          ...p,
          receiptPdfUrl: res.data.data.receiptPdfUrl,
        }));
      }
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAskOwnerPayment = async () => {
    if (!window.confirm("Notify the owner to confirm payment receipt?")) return;
    setActionLoading(true);
    try {
      await agreementAPI.askOwnerPayment(id, {});
      alert("Owner has been notified to confirm payment.");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!window.confirm("Generate PDF for this agreement?")) return;
    setActionLoading(true);
    try {
      await agreementAPI.generatePDF(id);
      alert("PDF generated successfully!");
      fetchAgreement();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate PDF.");
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
        user: event.actorType === "buyer" ? agreement.buyer : agreement.owner,
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
      user: agreement.buyer,
    });

    if (agreement.counterOfferPrice) {
      timeline.push({
        type: "owner",
        action: "counter-offered",
        price: agreement.counterOfferPrice,
        note: agreement.ownerNotes,
        timestamp: agreement.ownerCounterAt || agreement.updatedAt,
        user: agreement.owner,
      });
    }

    if (agreement.buyerCounterPrice) {
      timeline.push({
        type: "buyer",
        action: "counter-offered",
        price: agreement.buyerCounterPrice,
        note: agreement.buyerNotes,
        timestamp: agreement.buyerCounterAt || agreement.updatedAt,
        user: agreement.buyer,
      });
    }
  }

  const latestOffer = timeline[timeline.length - 1];

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

      {/* Property & Parties Info */}
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
              <strong>{agreement.buyer?.name}</strong>
            </p>
            <p>{agreement.buyer?.email}</p>
            <p>{agreement.buyer?.phone}</p>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3>Owner</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>{agreement.owner?.name}</strong>
            </p>
            <p>{agreement.owner?.email}</p>
            <p>{agreement.owner?.phone}</p>
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

      {/* Payment Details */}
      {payment && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__header">
            <h3>💳 Payment Submitted by Buyer</h3>
          </div>
          <div className="card__body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem 2rem",
              }}
            >
              <p>
                <strong>Gateway:</strong> {payment.paymentGateway}
              </p>
              <p>
                <strong>Transaction ID:</strong>{" "}
                <code>{payment.transactionId}</code>
              </p>
              <p>
                <strong>Amount:</strong> ETB{" "}
                {Number(payment.amount).toLocaleString()}
              </p>
              <p>
                <strong>Reference:</strong> {payment.referenceNumber}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Owner Confirmed:</strong>{" "}
                {payment.ownerConfirmed ? (
                  <span style={{ color: "green" }}>
                    ✅ Yes —{" "}
                    {new Date(payment.ownerConfirmedAt).toLocaleString()}
                  </span>
                ) : (
                  <span style={{ color: "#f59e0b" }}>⏳ Pending</span>
                )}
              </p>
            </div>
            {payment.receiptUrl && (
              <div style={{ marginTop: "1rem" }}>
                <p>
                  <strong>📎 Buyer Receipt:</strong>
                </p>
                {payment.receiptUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img
                    src={payment.receiptUrl}
                    alt="Payment receipt"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "400px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      marginTop: "0.5rem",
                    }}
                  />
                ) : (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--sm btn--outline"
                    style={{ marginTop: "0.5rem" }}
                  >
                    📎 Open Receipt
                  </a>
                )}
              </div>
            )}
            {!payment.receiptUrl && (
              <p style={{ marginTop: "0.75rem", color: "#6b7280" }}>
                No receipt image uploaded by buyer.
              </p>
            )}
            {payment.receiptPdfUrl && (
              <div style={{ marginTop: "0.75rem" }}>
                <a
                  href={payment.receiptPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--sm btn--primary"
                >
                  📄 Download Verified Receipt PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Note */}
      {agreement.adminNote && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__header">
            <h3>📝 Admin Note</h3>
          </div>
          <div className="card__body">
            <p>{agreement.adminNote}</p>
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
                      {event.type === "buyer" ? "Buyer" : "Owner"}
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

      {/* Admin Actions */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card__header">
          <h3>⚙️ Admin Actions</h3>
        </div>
        <div className="card__body">
          <div className="action-buttons">
            {agreement.status === "pending" && (
              <button
                className="btn btn--primary"
                onClick={handleForwardToOwner}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "📨 Forward to Owner"}
              </button>
            )}
            {agreement.status === "counter_offer" && (
              <>
                <div
                  className="alert alert--info"
                  style={{ marginBottom: "1rem" }}
                >
                  Owner has made a counter-offer. Review and forward it to the
                  buyer.
                </div>
                <button
                  className="btn btn--warning"
                  onClick={handleSendCounterToBuyer}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "⏳ Processing..."
                    : "📨 Send Counter-Offer to Buyer"}
                </button>
              </>
            )}
            {agreement.status === "buyer_counter_offer" && (
              <>
                <div
                  className="alert alert--info"
                  style={{ marginBottom: "1rem" }}
                >
                  Buyer has made a counter-offer. Review and forward it to the
                  owner.
                </div>
                <button
                  className="btn btn--warning"
                  onClick={handleForwardBuyerCounter}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "⏳ Processing..."
                    : "📨 Forward Counter-Offer to Owner"}
                </button>
              </>
            )}
            {agreement.status === "buyer_accepted_counter" && (
              <button
                className="btn btn--success"
                onClick={handleApproveBuyerAcceptance}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "✓ Approve Agreement"}
              </button>
            )}
            {agreement.status === "payment_submitted" && (
              <>
                <div
                  className="alert alert--info"
                  style={{ marginBottom: "1rem" }}
                >
                  Buyer has submitted payment. Ask the owner to confirm receipt
                  before generating the PDF.
                </div>
                <button
                  className="btn btn--warning"
                  onClick={handleAskOwnerPayment}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "⏳ Processing..."
                    : "📨 Ask Owner to Confirm Payment"}
                </button>
              </>
            )}
            {agreement.status === "payment_confirmed" && (
              <>
                <div
                  className="alert alert--info"
                  style={{ marginBottom: "1rem" }}
                >
                  ✅ Owner confirmed payment received. Review the payment
                  details above and verify to proceed.
                </div>
                <button
                  className="btn btn--success"
                  onClick={handleVerifyPayment}
                  disabled={actionLoading}
                >
                  {actionLoading ? "⏳ Processing..." : "✅ Verify Payment"}
                </button>
              </>
            )}
            {agreement.status === "payment_verified" && !agreement.pdfUrl && (
              <>
                {payment?.receiptPdfUrl && (
                  <div
                    className="alert alert--info"
                    style={{ marginBottom: "1rem" }}
                  >
                    <a
                      href={payment.receiptPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--sm btn--outline"
                    >
                      📄 Download Payment Receipt PDF
                    </a>
                  </div>
                )}
                <button
                  className="btn btn--primary"
                  onClick={handleGeneratePDF}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "⏳ Processing..."
                    : "📄 Generate Agreement PDF & Complete"}
                </button>
              </>
            )}
            {agreement.status === "owner_approved" && !agreement.pdfUrl && (
              <div className="alert alert--info">
                <div style={{ marginBottom: "0.75rem" }}>
                  Waiting for buyer to submit payment...
                </div>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() =>
                    navigate(
                      `/formal-agreements/new?negotiationId=${agreement.id}`,
                    )
                  }
                >
                  📝 Create Formal Agreement
                </button>
              </div>
            )}
            {(agreement.status === "counter_offer_sent" ||
              agreement.status === "forwarded_to_owner" ||
              agreement.status === "buyer_counter_forwarded") && (
              <div className="alert alert--info">
                Waiting for{" "}
                {agreement.status === "forwarded_to_owner" ||
                agreement.status === "buyer_counter_forwarded"
                  ? "owner"
                  : "buyer"}{" "}
                response...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementDetailPage;
