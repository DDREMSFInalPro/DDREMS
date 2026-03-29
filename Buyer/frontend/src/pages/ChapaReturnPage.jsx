/**
 * Chapa Return Page
 * User lands here after completing (or cancelling) Chapa payment.
 * Verifies the transaction and shows result.
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentAPI } from "../services/api";

const ChapaReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const txRef = searchParams.get("tx_ref");
    if (!txRef) { setStatus("failed"); return; }

    paymentAPI.verifyChapaReturn(txRef)
      .then((res) => {
        const p = res.data.data;
        setPayment(p);
        setStatus(p.paymentStatus === "completed" ? "success" : "failed");
      })
      .catch(() => setStatus("failed"));
  }, []);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
        {status === "verifying" && (
          <>
            <div className="spinner" style={{ margin: "0 auto 1rem" }} />
            <h2>Verifying your payment...</h2>
            <p style={{ color: "#64748b" }}>Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ color: "#10b981" }}>Payment Successful!</h2>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>
              Your payment of <strong>ETB {Number(payment?.amount).toLocaleString()}</strong> has been received.
            </p>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
              Reference: <code>{payment?.referenceNumber}</code>
            </p>
            <button className="btn btn--primary" onClick={() => navigate("/agreements")}>
              View My Agreements
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>❌</div>
            <h2 style={{ color: "#ef4444" }}>Payment Failed or Cancelled</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Your payment could not be verified. If you were charged, please contact support.
            </p>
            <button className="btn btn--outline" onClick={() => navigate("/agreements")}>
              Back to Agreements
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChapaReturnPage;
