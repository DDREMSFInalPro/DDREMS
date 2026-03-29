/**
 * Recommendations Component
 * Fetches AI-powered KNN property recommendations via Node API → Flask.
 * Props: price (number), bedrooms (number), location (string)
 *
 * Valid locations: Adama, AddisAbaba, BahirDar, DireDawa, Hawassa
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Recommendations.css";

const LOCATIONS = ["AddisAbaba", "DireDawa", "BahirDar", "Hawassa", "Adama"];
const LOCATION_LABELS = {
  AddisAbaba: "Addis Ababa",
  DireDawa:   "Dire Dawa",
  BahirDar:   "Bahir Dar",
  Hawassa:    "Hawassa",
  Adama:      "Adama",
};

const Recommendations = ({ price: initPrice, bedrooms: initBedrooms, location: initLocation }) => {
  const [price,    setPrice]    = useState(initPrice    || 2500000);
  const [bedrooms, setBedrooms] = useState(initBedrooms || 3);
  const [location, setLocation] = useState(initLocation || "AddisAbaba");

  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError("");
    setProperties([]);
    try {
      const res = await api.post("/ai/knn-recommend", { price, bedrooms, location });
      const data = res.data;
      setProperties(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not connect to recommendation service.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and whenever inputs change
  useEffect(() => {
    fetchRecommendations();
  }, [price, bedrooms, location]);

  const signalColor = { buy: "#10b981", save: "#6366f1", click: "#f59e0b", view: "#94a3b8" };

  return (
    <div className="recommendations">
      <div className="recommendations__header">
        <h3>🤖 AI Property Recommendations</h3>
        <p>KNN model trained on real buyer behaviour data</p>
      </div>

      {/* Filter bar */}
      <div className="recommendations__filters">
        <div className="rec-filter">
          <label>📍 Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{LOCATION_LABELS[l]}</option>
            ))}
          </select>
        </div>
        <div className="rec-filter">
          <label>🛏 Bedrooms</label>
          <select value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="rec-filter">
          <label>💰 Budget (ETB)</label>
          <select value={price} onChange={(e) => setPrice(Number(e.target.value))}>
            {[500000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000].map((p) => (
              <option key={p} value={p}>{Number(p).toLocaleString()}</option>
            ))}
          </select>
        </div>
        <button className="btn btn--sm btn--primary rec-filter__btn" onClick={fetchRecommendations} disabled={loading}>
          {loading ? "..." : "🔄 Refresh"}
        </button>
      </div>

      {loading && (
        <div className="recommendations__loading">
          <div className="rec-spinner" />
          <span>Finding best matches...</span>
        </div>
      )}

      {error && (
        <div className="recommendations__error">
          ⚠️ {error}
          <button className="btn btn--sm btn--outline" style={{ marginLeft: "1rem" }} onClick={fetchRecommendations}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="recommendations__grid">
          {properties.map((prop, idx) => (
            <div key={`${prop.property_id}-${idx}`} className="rec-card">
              <div className="rec-card__badge">#{idx + 1} Match</div>
              <div className="rec-card__body">
                <div className="rec-card__row">
                  <span className="rec-card__label">ID</span>
                  <span className="rec-card__value">#{prop.property_id}</span>
                </div>
                <div className="rec-card__row">
                  <span className="rec-card__label">📍 Location</span>
                  <span className="rec-card__value">{LOCATION_LABELS[prop.location] || prop.location}</span>
                </div>
                <div className="rec-card__row">
                  <span className="rec-card__label">💰 Price</span>
                  <span className="rec-card__value rec-card__price">
                    ETB {Number(prop.price).toLocaleString()}
                  </span>
                </div>
                <div className="rec-card__row">
                  <span className="rec-card__label">🛏 Bedrooms</span>
                  <span className="rec-card__value">{prop.bedrooms}</span>
                </div>
                <div className="rec-card__row">
                  <span className="rec-card__label">📊 Signal</span>
                  <span
                    className="rec-card__value rec-card__signal"
                    style={{ color: signalColor[prop.action] || "#64748b" }}
                  >
                    {prop.action}
                  </span>
                </div>
              </div>
              <div className="rec-card__footer">
                <button
                  className="btn btn--sm btn--primary"
                  onClick={() => navigate(`/browse/${prop.property_id}`)}
                >
                  View Property
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <p className="recommendations__empty">No recommendations found. Try adjusting your filters.</p>
      )}
    </div>
  );
};

export default Recommendations;
