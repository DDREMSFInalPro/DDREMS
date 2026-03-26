import React from 'react';
import './StatsSection.css';

function StatsSection({ totalProperties }) {
  return (
    <div className="stats-section">
      <div className="stat-card">
        <div className="stat-icon">🏠</div>
        <div className="stat-number">{totalProperties}</div>
        <div className="stat-label">Available Properties</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📍</div>
        <div className="stat-number">5</div>
        <div className="stat-label">Locations</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-number">4.5M</div>
        <div className="stat-label">Avg Price (ETB)</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-number">156</div>
        <div className="stat-label">Successful Sales</div>
      </div>
    </div>
  );
}

export default StatsSection;
