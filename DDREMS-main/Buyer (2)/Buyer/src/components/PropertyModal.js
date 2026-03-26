import React from 'react';
import './Modal.css';

function PropertyModal({ property, isSaved, onClose, onToggleSave, onOpenInquiry, onOpenPurchase }) {
  const formatPrice = (price) => price.toLocaleString('en-US');

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Property Details</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="property-detail-image-container">
            <img 
              src={property.image} 
              alt={property.title}
              className="property-detail-image-real"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="property-detail-image-fallback">
              {property.icon}
            </div>
          </div>
          
          <div className="detail-section">
            <h3>{property.title}</h3>
            <p style={{ color: '#666', marginTop: '10px', lineHeight: '1.7', fontSize: '1.05em' }}>
              {property.description}
            </p>
          </div>

          <div className="detail-section">
            <h3>Property Information</h3>
            <div className="detail-row">
              <span>Property Type:</span>
              <strong>{property.type.toUpperCase()}</strong>
            </div>
            <div className="detail-row">
              <span>Location:</span>
              <strong>{property.location.charAt(0).toUpperCase() + property.location.slice(1)}, Dire Dawa</strong>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <strong style={{ color: property.status === 'available' ? '#28a745' : '#ffc107' }}>
                {property.status.toUpperCase()}
              </strong>
            </div>
            {property.yearBuilt && (
              <div className="detail-row">
                <span>Year Built:</span>
                <strong>{property.yearBuilt}</strong>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3>Property Details</h3>
            {property.bedrooms > 0 && (
              <>
                <div className="detail-row">
                  <span>🛏️ Bedrooms:</span>
                  <strong>{property.bedrooms}</strong>
                </div>
                <div className="detail-row">
                  <span>🚿 Bathrooms:</span>
                  <strong>{property.bathrooms}</strong>
                </div>
              </>
            )}
            <div className="detail-row">
              <span>📐 Area:</span>
              <strong>{property.area} m²</strong>
            </div>
            <div className="detail-row">
              <span>💰 Price:</span>
              <strong style={{ color: '#28a745', fontSize: '1.3em' }}>
                {formatPrice(property.price)} ETB
              </strong>
            </div>
          </div>

          {property.features && (
            <div className="detail-section">
              <h3>Features & Amenities</h3>
              <div className="features-list">
                {property.features.map((feature, index) => (
                  <span key={index} className="feature-tag">✓ {feature}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '30px' }}>
            <button 
              className="btn btn-primary buy-now-btn" 
              onClick={() => onOpenPurchase(property.id)}
              disabled={property.status !== 'available'}
            >
              💳 Buy Now
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => onOpenInquiry(property.id)}
            >
              📧 Inquire
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => onToggleSave(property.id)}
            >
              {isSaved ? '❤️ Saved' : '🤍 Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyModal;
