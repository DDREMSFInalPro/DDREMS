import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Recommendations from "../components/Recommendations";
import "./AIPricePage.css";

const AIPricePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    propertyType: "apartment",
    listingType: "sale",
    sizeSqm: "",
    bedrooms: "2",
    bathrooms: "1",
    city: "DireDawa",
    listedPrice: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/ai/recommend", form);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get recommendation.");
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="ai-page">
      <div className="page-header">
        <h1>🤖 AI Price Recommender</h1>
        <p>Get an AI-powered market price estimate and find out if a property is worth buying or renting.</p>
      </div>

      <div className="ai-page__layout">
        {/* Form */}
        <div className="card ai-page__form-card">
          <div className="card__header"><h3>Property Details</h3></div>
          <div className="card__body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="propertyType" value={form.propertyType} onChange={handleChange}>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                    <option value="office">Office</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Listing Type</label>
                  <select name="listingType" value={form.listingType} onChange={handleChange}>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Size (sqm)</label>
                  <input type="number" name="sizeSqm" value={form.sizeSqm} onChange={handleChange} placeholder="e.g. 120" min="10" />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <select name="city" value={form.city} onChange={handleChange}>
                    <option value="DireDawa">Dire Dawa</option>
                    <option value="AddisAbaba">Addis Ababa</option>
                    <option value="BahirDar">Bahir Dar</option>
                    <option value="Hawassa">Hawassa</option>
                    <option value="Adama">Adama</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bedrooms</label>
                  <select name="bedrooms" value={form.bedrooms} onChange={handleChange}>
                    {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bathrooms</label>
                  <select name="bathrooms" value={form.bathrooms} onChange={handleChange}>
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Listed Price (ETB) — optional, for deal analysis</label>
                <input type="number" name="listedPrice" value={form.listedPrice} onChange={handleChange} placeholder="Enter the property's asking price" min="0" />
              </div>

              {error && <div className="alert alert--error">{error}</div>}

              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? "⏳ Analyzing..." : "🤖 Get AI Recommendation"}
              </button>
            </form>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="ai-page__result">
            {/* Recommended Price */}
            <div className="card ai-result-card">
              <div className="card__header"><h3>💰 AI Price Estimate</h3></div>
              <div className="card__body">
                <div className="ai-result__price">
                  ETB {Number(result.recommendedPrice).toLocaleString()}
                  <span>{result.inputs.listingType === 'rent' ? '/month' : ''}</span>
                </div>
                <div className="ai-result__confidence">
                  <span>Confidence</span>
                  <div className="confidence-bar">
                    <div className="confidence-bar__fill" style={{ width: `${confidencePct}%`, background: confidencePct >= 80 ? '#10b981' : confidencePct >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span>{confidencePct}%</span>
                </div>
                <p className="ai-result__source">
                  Source: {result.source === 'ai_model' ? '🤖 AI Model' : '📊 Market Rules'}
                  {result.details && <span> — {result.details}</span>}
                </p>
              </div>
            </div>

            {/* Verdict */}
            {result.verdict && (
              <div className="card ai-verdict-card" style={{ borderLeft: `4px solid ${result.verdict.color}` }}>
                <div className="card__header"><h3>📊 Deal Analysis</h3></div>
                <div className="card__body">
                  <div className="ai-verdict__badge" style={{ background: result.verdict.color }}>
                    {result.verdict.label}
                  </div>
                  <p className="ai-verdict__message">{result.verdict.message}</p>
                  <div className="ai-verdict__comparison">
                    <div>
                      <span>Listed Price</span>
                      <strong>ETB {Number(form.listedPrice).toLocaleString()}</strong>
                    </div>
                    <div className="ai-verdict__vs">vs</div>
                    <div>
                      <span>AI Estimate</span>
                      <strong>ETB {Number(result.recommendedPrice).toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="ai-verdict__action">
                    {['great_deal','good_deal','fair_price'].includes(result.verdict.verdict)
                      ? <p className="ai-verdict__recommend ai-verdict__recommend--buy">✅ Recommended: {result.inputs.listingType === 'rent' ? 'Rent' : 'Buy'} this property</p>
                      : <p className="ai-verdict__recommend ai-verdict__recommend--skip">⚠️ Consider negotiating or looking for alternatives</p>
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Similar Properties */}
            {result.similarProperties?.length > 0 && (
              <div className="card">
                <div className="card__header"><h3>🏠 Similar Properties on Market</h3></div>
                <div className="card__body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Price (ETB)</th>
                          <th>Size</th>
                          <th>Beds</th>
                          <th>Location</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.similarProperties.map((p) => (
                          <tr key={p.id}>
                            <td>{p.title}</td>
                            <td><strong>{Number(p.price).toLocaleString()}</strong></td>
                            <td>{p.sizeSqm ? `${p.sizeSqm} sqm` : '—'}</td>
                            <td>{p.bedrooms || '—'}</td>
                            <td>{p.address}</td>
                            <td>
                              <button className="btn btn--sm btn--outline" onClick={() => navigate(`/browse/${p.id}`)}>View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KNN Property Recommendations based on current form inputs */}
      <Recommendations
        price={form.listedPrice ? Number(form.listedPrice) : 2000000}
        bedrooms={Number(form.bedrooms)}
        location={form.city}
      />
    </div>
  );
};

export default AIPricePage;
