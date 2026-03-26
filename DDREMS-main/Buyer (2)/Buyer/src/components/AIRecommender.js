import React, { useState } from 'react';
import './AIRecommender.css';

function AIRecommender() {
  const [formData, setFormData] = useState({
    propertyName: '',
    category: '',
    currentPrice: ''
  });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getAIRecommendation = () => {
    if (!formData.propertyName || !formData.category || !formData.currentPrice) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setRecommendation(null);

    setTimeout(() => {
      const currentPrice = parseFloat(formData.currentPrice);
      
      // AI algorithm simulation with market analysis
      const marketAverage = currentPrice * (0.85 + Math.random() * 0.3);
      const recommendedPrice = marketAverage * 0.95;
      const savings = currentPrice - recommendedPrice;
      const confidence = 75 + Math.random() * 20;
      
      let verdict = '';
      let priceStatus = '';
      let color = '';
      
      if (currentPrice > marketAverage * 1.15) {
        verdict = '⚠️ Overpriced';
        priceStatus = 'This property is priced above market average. Consider negotiating or waiting for a better deal.';
        color = '#dc3545';
      } else if (currentPrice < marketAverage * 0.9) {
        verdict = '✅ Great Deal';
        priceStatus = 'Excellent price! This is below market average. Consider buying now before prices increase.';
        color = '#28a745';
      } else {
        verdict = '💰 Fair Price';
        priceStatus = 'Price is within normal market range. Reasonable purchase at current market conditions.';
        color = '#ffc107';
      }

      setRecommendation({
        verdict,
        priceStatus,
        color,
        currentPrice,
        marketAverage,
        recommendedPrice,
        savings: Math.abs(savings),
        confidence
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="ai-recommender">
      <h2>
        <span className="ai-icon">🤖</span> 
        AI Price Recommender
      </h2>
      <p className="ai-description">
        Get intelligent price recommendations based on market analysis and property data
      </p>
      
      <div className="price-input-group">
        <input
          type="text"
          name="propertyName"
          value={formData.propertyName}
          onChange={handleChange}
          placeholder="Property name (e.g., Modern Apartment)"
        />
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Category (e.g., Apartment, Villa)"
        />
        <input
          type="number"
          name="currentPrice"
          value={formData.currentPrice}
          onChange={handleChange}
          placeholder="Current price (ETB)"
        />
        <button className="recommend-btn" onClick={getAIRecommendation}>
          Get AI Recommendation
        </button>
      </div>

      {loading && (
        <div className="recommendation-result">
          <p>🔄 Analyzing market data and property trends...</p>
        </div>
      )}

      {recommendation && !loading && (
        <div className="recommendation-result" style={{ borderLeft: `4px solid ${recommendation.color}` }}>
          <h3 style={{ color: recommendation.color }}>{recommendation.verdict}</h3>
          <div className="recommendation-details">
            <div className="detail-row">
              <span>Property:</span>
              <strong>{formData.propertyName}</strong>
            </div>
            <div className="detail-row">
              <span>Category:</span>
              <strong>{formData.category}</strong>
            </div>
            <div className="detail-row">
              <span>Current Price:</span>
              <strong>{recommendation.currentPrice.toLocaleString()} ETB</strong>
            </div>
            <div className="detail-row">
              <span>Market Average:</span>
              <strong>{recommendation.marketAverage.toFixed(0).toLocaleString()} ETB</strong>
            </div>
            <div className="detail-row">
              <span>Recommended Price:</span>
              <strong style={{ color: '#28a745' }}>
                {recommendation.recommendedPrice.toFixed(0).toLocaleString()} ETB
              </strong>
            </div>
            <div className="detail-row">
              <span>Potential Savings:</span>
              <strong>{recommendation.savings.toFixed(0).toLocaleString()} ETB</strong>
            </div>
            <div className="detail-row">
              <span>AI Confidence:</span>
              <strong>{recommendation.confidence.toFixed(1)}%</strong>
            </div>
          </div>
          <p className="price-status">{recommendation.priceStatus}</p>
        </div>
      )}
    </div>
  );
}

export default AIRecommender;
