import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formalAgreementAPI } from "../services/api";

const FormalAgreementPage = () => {
  const { id } = useParams(); // negotiation agreement id
  const navigate = useNavigate();
  const [fa, setFa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFa();
  }, [id]);

  const fetchFa = async () => {
    setLoading(true);
    try {
      const res = await formalAgreementAPI.getByNegotiation(id);
      setFa(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (
      !window.confirm(
        "Sign this formal agreement? This action cannot be undone.",
      )
    )
      return;
    setActionLoading(true);
    try {
      await formalAgreementAPI.sign(fa.id);
      alert("Agreement signed successfully!");
      fetchFa();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to sign.");
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

  if (!fa) {
    return (
      <div className="page">
        <div className="page-header">
          <button
            className="btn btn--outline"
            onClick={() => navigate("/agreements")}
          >
            ← Back
          </button>
          <h1>Formal Agreement</h1>
        </div>
        <div className="card">
          <div className="card__body">
            <div className="alert alert--info">
              No formal agreement has been created yet for this negotiation. The
              admin will create one after the price is agreed.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button
          className="btn btn--outline"
          onClick={() => navigate("/agreements")}
        >
          ← Back
        </button>
        <div>
          <h1>Formal Agreement</h1>
          <p>ID: {fa.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Progress */}
      <div
        className="card"
        style={{
          marginBottom: "1rem",
          background: fa.status === "completed" ? "#f0fdf4" : "#fffbeb",
          border: `2px solid ${fa.status === "completed" ? "#22c55e" : "#f59e0b"}`,
        }}
      >
        <div className="card__body">
          <strong>Status: {fa.status.replace(/_/g, " ").toUpperCase()}</strong>
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span>
              {fa.ownerSigned ? "✅ You Signed" : "⏳ Your Signature Needed"}
            </span>
            <span>
              {fa.paymentStatus === "paid"
                ? "✅ Payment Verified"
                : fa.paymentProofUrl
                  ? "⏳ Payment Under Review"
                  : "⏳ Awaiting Buyer Payment"}
            </span>
            <span>
              {fa.buyerSigned ? "✅ Buyer Signed" : "⏳ Buyer Not Signed"}
            </span>
          </div>
          {fa.pdfUrl && (
            <a
              href={fa.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--sm btn--primary"
              style={{ marginTop: "0.75rem", display: "inline-block" }}
            >
              📥 Download Final Agreement PDF
            </a>
          )}
        </div>
      </div>

      <div className="agreement-info-grid">
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
              <strong>Payment Deadline:</strong> {fa.paymentDeadline}
            </p>
            {fa.terms && (
              <p>
                <strong>Terms:</strong> {fa.terms}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card__header">
            <h3>Signatures</h3>
          </div>
          <div className="card__body">
            <p>
              Owner:{" "}
              {fa.ownerSigned
                ? `✅ Signed on ${new Date(fa.ownerSignedAt).toLocaleDateString()}`
                : "⏳ Not signed"}
            </p>
            <p>
              Buyer:{" "}
              {fa.buyerSigned
                ? `✅ Signed on ${new Date(fa.buyerSignedAt).toLocaleDateString()}`
                : "⏳ Not signed"}
            </p>
          </div>
        </div>
      </div>

      {/* Owner sign action */}
      {!fa.ownerSigned && fa.status === "agreement_created" && (
        <div
          className="card"
          style={{ marginTop: "1rem", border: "2px solid #3b82f6" }}
        >
          <div className="card__header" style={{ background: "#eff6ff" }}>
            <h3>✍️ Your Signature Required</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "1rem" }}>
              Please review the agreement terms above and sign to proceed. Once
              you sign, the buyer will be notified to upload payment proof.
            </p>
            <button
              className="btn btn--primary"
              onClick={handleSign}
              disabled={actionLoading}
            >
              {actionLoading ? "⏳ Signing..." : "✍️ Sign Agreement"}
            </button>
          </div>
        </div>
      )}

      {fa.ownerSigned && fa.status !== "completed" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__body">
            <div className="alert alert--info">
              {!fa.paymentProofUrl &&
                "You have signed. Waiting for buyer to upload payment proof..."}
              {fa.paymentProofUrl &&
                fa.paymentStatus !== "paid" &&
                "Payment proof uploaded by buyer. Admin is verifying..."}
              {fa.paymentStatus === "paid" &&
                !fa.buyerSigned &&
                "Payment verified. Waiting for buyer to sign..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormalAgreementPage;
