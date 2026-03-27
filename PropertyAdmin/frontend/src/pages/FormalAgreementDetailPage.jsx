import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formalAgreementAPI, agreementAPI } from "../services/api";

const FormalAgreementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fa, setFa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // For create-from-negotiation mode
  const isCreate = id === "new";
  const [negotiationId, setNegotiationId] = useState(
    new URLSearchParams(window.location.search).get("negotiationId") || "",
  );
  const [negotiation, setNegotiation] = useState(null);
  const [form, setForm] = useState({
    finalPrice: "",
    paymentMethod: "Chapa",
    paymentDeadline: "",
    terms: "",
  });

  useEffect(() => {
    if (isCreate) {
      if (negotiationId) loadNegotiation();
      setLoading(false);
    } else {
      fetchFa();
    }
  }, [id]);

  const loadNegotiation = async () => {
    try {
      const res = await agreementAPI.getById(negotiationId);
      const neg = res.data.data;
      setNegotiation(neg);
      // Pre-fill final price from last negotiated value
      const lastPrice = neg.negotiationHistory?.length
        ? neg.negotiationHistory[neg.negotiationHistory.length - 1].price
        : neg.buyerCounterPrice ||
          neg.counterOfferPrice ||
          neg.salePrice ||
          neg.monthlyRent;
      setForm((f) => ({ ...f, finalPrice: lastPrice || "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFa = async () => {
    setLoading(true);
    try {
      const res = await formalAgreementAPI.getById(id);
      setFa(res.data.data);
    } catch (err) {
      alert("Failed to load formal agreement.");
      navigate("/formal-agreements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.finalPrice || !form.paymentMethod || !form.paymentDeadline) {
      alert("Final price, payment method and deadline are required.");
      return;
    }
    setActionLoading(true);
    try {
      await formalAgreementAPI.create({ negotiationId, ...form });
      alert("Formal agreement created. Negotiation is now locked.");
      navigate("/formal-agreements");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!window.confirm("Verify this payment proof?")) return;
    setActionLoading(true);
    try {
      await formalAgreementAPI.verifyPayment(id);
      alert("Payment verified. Buyer can now sign.");
      fetchFa();
    } catch (err) {
      alert(err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!window.confirm("Generate final agreement PDF?")) return;
    setActionLoading(true);
    try {
      const res = await formalAgreementAPI.generatePDF(id);
      alert("PDF generated. Agreement completed!");
      fetchFa();
    } catch (err) {
      alert(err.response?.data?.message || "Failed.");
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

  // CREATE MODE
  if (isCreate) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn--outline" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Create Formal Agreement</h1>
        </div>
        {negotiation && (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="card__header">
              <h3>Negotiation Summary</h3>
            </div>
            <div className="card__body">
              <p>
                <strong>Property:</strong> {negotiation.property?.title}
              </p>
              <p>
                <strong>Buyer:</strong> {negotiation.buyer?.name} (
                {negotiation.buyer?.email})
              </p>
              <p>
                <strong>Owner:</strong> {negotiation.owner?.name}
              </p>
              <p>
                <strong>Type:</strong> {negotiation.agreementType}
              </p>
            </div>
          </div>
        )}
        <div className="card">
          <div className="card__header">
            <h3>Agreement Details</h3>
          </div>
          <div className="card__body">
            <div className="form-group">
              <label>Final Agreed Price (ETB) *</label>
              <input
                type="number"
                value={form.finalPrice}
                onChange={(e) =>
                  setForm({ ...form, finalPrice: e.target.value })
                }
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Payment Method *</label>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
              >
                <option value="Chapa">Chapa</option>
                <option value="CBE">CBE (Commercial Bank of Ethiopia)</option>
                <option value="Abyssinia">Bank of Abyssinia</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Deadline *</label>
              <input
                type="date"
                value={form.paymentDeadline}
                onChange={(e) =>
                  setForm({ ...form, paymentDeadline: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="form-group">
              <label>Terms & Conditions</label>
              <textarea
                rows={4}
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                placeholder="Enter any additional terms..."
              />
            </div>
            <button
              className="btn btn--primary"
              onClick={handleCreate}
              disabled={actionLoading}
            >
              {actionLoading ? "⏳ Creating..." : "📝 Create Formal Agreement"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!fa) return null;

  const canVerifyPayment = fa.paymentProofUrl && fa.paymentStatus === "pending";
  const canGeneratePDF =
    fa.ownerSigned &&
    fa.buyerSigned &&
    fa.paymentStatus === "paid" &&
    !fa.pdfUrl;

  return (
    <div className="page">
      <div className="page-header">
        <button
          className="btn btn--outline"
          onClick={() => navigate("/formal-agreements")}
        >
          ← Back
        </button>
        <div>
          <h1>Formal Agreement</h1>
          <p>ID: {fa.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Status banner */}
      <div
        className="card"
        style={{
          marginBottom: "1rem",
          background: fa.status === "completed" ? "#f0fdf4" : "#fffbeb",
          border: `2px solid ${fa.status === "completed" ? "#22c55e" : "#f59e0b"}`,
        }}
      >
        <div
          className="card__body"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>
            {fa.status === "completed" ? "✅" : "📋"}
          </span>
          <div>
            <strong>
              Status: {fa.status.replace(/_/g, " ").toUpperCase()}
            </strong>
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                marginTop: "0.25rem",
                flexWrap: "wrap",
              }}
            >
              <span>
                {fa.ownerSigned ? "✅ Owner Signed" : "⏳ Owner Not Signed"}
              </span>
              <span>
                {fa.paymentStatus === "paid"
                  ? "✅ Payment Verified"
                  : fa.paymentProofUrl
                    ? "⏳ Payment Proof Uploaded"
                    : "⏳ Awaiting Payment"}
              </span>
              <span>
                {fa.buyerSigned ? "✅ Buyer Signed" : "⏳ Buyer Not Signed"}
              </span>
            </div>
          </div>
          {fa.pdfUrl && (
            <a
              href={fa.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--sm btn--primary"
              style={{ marginLeft: "auto" }}
            >
              📥 Download PDF
            </a>
          )}
        </div>
      </div>

      <div className="agreement-info-grid">
        <div className="card">
          <div className="card__header">
            <h3>Property</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>{fa.property?.title}</strong>
            </p>
            <p>{fa.property?.address}</p>
          </div>
        </div>
        <div className="card">
          <div className="card__header">
            <h3>Buyer</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>{fa.buyer?.name}</strong>
            </p>
            <p>{fa.buyer?.email}</p>
            <p>{fa.buyer?.phone}</p>
          </div>
        </div>
        <div className="card">
          <div className="card__header">
            <h3>Owner</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>{fa.owner?.name}</strong>
            </p>
            <p>{fa.owner?.email}</p>
            <p>{fa.owner?.phone}</p>
          </div>
        </div>
        <div className="card">
          <div className="card__header">
            <h3>Agreement Terms</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>Final Price:</strong> ETB{" "}
              {Number(fa.finalPrice).toLocaleString()}
            </p>
            <p>
              <strong>Payment Method:</strong> {fa.paymentMethod}
            </p>
            <p>
              <strong>Deadline:</strong> {fa.paymentDeadline}
            </p>
            {fa.terms && (
              <p>
                <strong>Terms:</strong> {fa.terms}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment proof */}
      {fa.paymentProofUrl && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__header">
            <h3>💳 Payment Proof</h3>
          </div>
          <div className="card__body">
            <p>
              <strong>Uploaded:</strong>{" "}
              {fa.paymentUploadedAt
                ? new Date(fa.paymentUploadedAt).toLocaleString()
                : "—"}
            </p>
            {fa.paymentProofUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
              <img
                src={fa.paymentProofUrl}
                alt="Payment proof"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  borderRadius: "6px",
                  marginTop: "0.5rem",
                  border: "1px solid #e5e7eb",
                }}
              />
            ) : (
              <a
                href={fa.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm btn--outline"
                style={{ marginTop: "0.5rem" }}
              >
                📎 View Proof
              </a>
            )}
          </div>
        </div>
      )}

      {/* Admin actions */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card__header">
          <h3>⚙️ Admin Actions</h3>
        </div>
        <div className="card__body">
          <div className="action-buttons">
            {canVerifyPayment && (
              <button
                className="btn btn--success"
                onClick={handleVerifyPayment}
                disabled={actionLoading}
              >
                {actionLoading ? "⏳ Processing..." : "✅ Verify Payment"}
              </button>
            )}
            {canGeneratePDF && (
              <button
                className="btn btn--primary"
                onClick={handleGeneratePDF}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "⏳ Generating..."
                  : "📄 Generate Final PDF & Complete"}
              </button>
            )}
            {!canVerifyPayment &&
              !canGeneratePDF &&
              fa.status !== "completed" && (
                <div className="alert alert--info">
                  {!fa.ownerSigned && "Waiting for owner to sign..."}
                  {fa.ownerSigned &&
                    !fa.paymentProofUrl &&
                    "Waiting for buyer to upload payment proof..."}
                  {fa.paymentProofUrl &&
                    fa.paymentStatus !== "paid" &&
                    "Payment proof uploaded — review and verify above."}
                  {fa.paymentStatus === "paid" &&
                    !fa.buyerSigned &&
                    "Waiting for buyer to sign..."}
                </div>
              )}
            {fa.status === "completed" && (
              <div className="alert alert--success">
                ✅ Agreement completed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormalAgreementDetailPage;
