import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formalAgreementAPI } from "../services/api";

const statusBadge = (status) => {
  const map = {
    agreement_created: "badge--warning",
    owner_signed: "badge--info",
    payment_uploaded: "badge--warning",
    payment_verified: "badge--info",
    buyer_signed: "badge--info",
    completed: "badge--success",
  };
  return `badge ${map[status] || "badge--default"}`;
};

const FormalAgreementsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, [statusFilter]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await formalAgreementAPI.getAll(params);
      setItems(res.data.data.formalAgreements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Formal Agreements</h1>
        <p>Post-negotiation signed agreements</p>
      </div>
      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="agreement_created">Agreement Created</option>
          <option value="owner_signed">Owner Signed</option>
          <option value="payment_uploaded">Payment Uploaded</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No formal agreements found</h3>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Buyer</th>
                <th>Owner</th>
                <th>Final Price</th>
                <th>Status</th>
                <th>Owner Signed</th>
                <th>Payment</th>
                <th>Buyer Signed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((fa) => (
                <tr key={fa.id}>
                  <td>{fa.property?.title || "—"}</td>
                  <td>{fa.buyer?.name || "—"}</td>
                  <td>{fa.owner?.name || "—"}</td>
                  <td>
                    <strong>
                      ETB {Number(fa.finalPrice).toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className={statusBadge(fa.status)}>
                      {fa.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>{fa.ownerSigned ? "✅" : "⏳"}</td>
                  <td>
                    <span
                      className={`badge ${fa.paymentStatus === "paid" ? "badge--success" : "badge--warning"}`}
                    >
                      {fa.paymentStatus}
                    </span>
                  </td>
                  <td>{fa.buyerSigned ? "✅" : "⏳"}</td>
                  <td>
                    <button
                      className="btn btn--sm btn--primary"
                      onClick={() => navigate(`/formal-agreements/${fa.id}`)}
                    >
                      View
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

export default FormalAgreementsPage;
