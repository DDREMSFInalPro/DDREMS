import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formalAgreementAPI } from "../services/api";

const FormalAgreementPage = () => {
  const { id } = useParams(); // negotiation agreement id
  const navigate = useNavigate();
  const [fa, setFa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const fileRef = useRef();

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

  const handleUploadProof = async () => {
    if (!proofFile) {
      alert("Please select a payment proof file.");
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("paymentProof", proofFile);
      await formalAgreementAPI.uploadPaymentProof(fa.id, formData);
      alert("Payment proof uploaded. Awaiting admin verification.");
      setProofFile(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchFa();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload payment proof.");
    } finally {
      setActionLoading(false);
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
              No formal agreement has been created yet. The admin will create
              one after the price is agreed.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canUploadProof =
    fa.ownerSigned && fa.paymentStatus !== "paid" && !fa.paymentProofUrl;
  const canSign =
    fa.ownerSigned && fa.paymentStatus === "paid" && !fa.buyerSigned;

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
              {fa.ownerSigned
                ? "✅ Owner Signed"
                : "⏳ Waiting for Owner Signature"}
            </span>
            <span>
              {fa.paymentStatus === "paid"
                ? "✅ Payment Verified"
                : fa.paymentProofUrl
                  ? "⏳ Payment Under Review"
                  : "⏳ Payment Required"}
            </span>
            <span>
              {fa.buyerSigned ? "✅ You Signed" : "⏳ Your Signature Needed"}
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

      {/* Agreement Terms */}
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
                : "⏳ Not signed yet"}
            </p>
            <p>
              You:{" "}
              {fa.buyerSigned
                ? `✅ Signed on ${new Date(fa.buyerSignedAt).toLocaleDateString()}`
                : "⏳ Not signed yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Payment Proof */}
      {canUploadProof && (
        <div
          className="card"
          style={{ marginTop: "1rem", border: "2px solid #f59e0b" }}
        >
          <div className="card__header" style={{ background: "#fffbeb" }}>
            <h3>💳 Upload Payment Proof</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "1rem" }}>
              The owner has signed. Please upload proof of payment (screenshot,
              receipt, or PDF) for ETB {Number(fa.finalPrice).toLocaleString()}{" "}
              via {fa.paymentMethod}.
            </p>
            <div className="form-group">
              <label>Payment Proof File *</label>
              <input
                type="file"
                accept="image/*,.pdf"
                ref={fileRef}
                onChange={(e) => setProofFile(e.target.files[0])}
              />
            </div>
            <button
              className="btn btn--primary"
              onClick={handleUploadProof}
              disabled={actionLoading || !proofFile}
            >
              {actionLoading ? "⏳ Uploading..." : "📤 Upload Payment Proof"}
            </button>
          </div>
        </div>
      )}

      {/* Payment proof uploaded, awaiting verification */}
      {fa.paymentProofUrl && fa.paymentStatus !== "paid" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__body">
            <div className="alert alert--info">
              ✅ Payment proof uploaded on{" "}
              {fa.paymentUploadedAt
                ? new Date(fa.paymentUploadedAt).toLocaleString()
                : "—"}
              . Waiting for admin to verify...
            </div>
          </div>
        </div>
      )}

      {/* Sign Agreement */}
      {canSign && (
        <div
          className="card"
          style={{ marginTop: "1rem", border: "2px solid #3b82f6" }}
        >
          <div className="card__header" style={{ background: "#eff6ff" }}>
            <h3>✍️ Sign the Agreement</h3>
          </div>
          <div className="card__body">
            <p style={{ marginBottom: "1rem" }}>
              Payment has been verified. Please review the terms above and sign
              to complete the agreement.
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

      {/* Waiting states */}
      {!canUploadProof && !canSign && fa.status !== "completed" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card__body">
            <div className="alert alert--info">
              {!fa.ownerSigned &&
                "Waiting for the owner to sign the agreement..."}
              {fa.ownerSigned &&
                fa.paymentProofUrl &&
                fa.paymentStatus !== "paid" &&
                "Payment proof submitted. Admin is verifying..."}
              {fa.ownerSigned &&
                fa.paymentStatus === "paid" &&
                fa.buyerSigned &&
                "You have signed. Admin will generate the final PDF shortly."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormalAgreementPage;
