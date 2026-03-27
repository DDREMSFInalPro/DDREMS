import React from 'react';
import './PropertyCard.css';

function PropertyCard({ property, isSaved, onView, onToggleSave, onInquire }) {
  const formatPrice = (price) => {
    return price.toLocaleString('en-US');
  };

  return (
    <div className="property-card" onClick={onView}>
      <div className="property-image-container">
        <img 
          src={property.image} 
          alt={property.title}
          className="property-image-real"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="property-image-fallback">
          {property.icon}
        </div>
        <div className="image-overlay"></div>
        <span className="property-badge">{property.type.toUpperCase()}</span>
        <span className={`property-status status-${property.status}`}>
          {property.status.toUpperCase()}
        </span>
      </div>
      <div className="property-info">
        <div className="property-title">{property.title}</div>
        <div className="property-location">
          📍 {property.location.charAt(0).toUpperCase() + property.location.slice(1)}, Dire Dawa
        </div>
        {property.bedrooms > 0 && (
          <div className="property-details">
            <div className="detail-item">
              <div className="detail-icon">🛏️</div>
              <div className="detail-value">{property.bedrooms}</div>
              <div className="detail-label">Beds</div>
            </div>
            <div className="detail-item">
              <div className="detail-icon">🚿</div>
              <div className="detail-value">{property.bathrooms}</div>
              <div className="detail-label">Baths</div>
            </div>
            <div className="detail-item">
              <div className="detail-icon">📐</div>
              <div className="detail-value">{property.area}</div>
              <div className="detail-label">m²</div>
            </div>
          </div>
        )}
        {property.bedrooms === 0 && (
          <div className="property-details">
            <div className="detail-item">
              <div className="detail-icon">📐</div>
              <div className="detail-value">{property.area}</div>
              <div className="detail-label">m²</div>
            </div>
          </div>
        )}
        <div className="property-price">{formatPrice(property.price)} ETB</div>
        <div className="property-actions">
          <button 
            className="btn btn-primary" 
            onClick={(e) => { e.stopPropagation(); onInquire(); }}
          >
            📧 Inquire
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          >
            {isSaved ? '❤️' : '🤍'} Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;
