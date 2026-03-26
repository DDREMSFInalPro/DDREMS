import React from 'react';
import './Modal.css';

function SavedModal({ savedProperties, properties, onClose, onViewProperty, onOpenInquiry }) {
  const saved = properties.filter(p => savedProperties.includes(p.id));
  const formatPrice = (price) => price.toLocaleString('en-US');

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>❤️ Saved Properties</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {saved.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No saved properties yet
            </p>
          ) : (
            <div className="saved-grid">
              {saved.map(property => (
                <div 
                  key={property.id} 
                  className="saved-card"
                  onClick={() => onViewProperty(property)}
                >
                  <div className="saved-image-container">
                    <img 
                      src={property.image} 
                      alt={property.title}
                      className="saved-image-real"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="saved-image-fallback">{property.icon}</div>
                  </div>
                  <div className="saved-info">
                    <h3>{property.title}</h3>
                    <p>📍 {property.location.charAt(0).toUpperCase() + property.location.slice(1)}</p>
                    <p className="saved-price">{formatPrice(property.price)} ETB</p>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '10px' }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onOpenInquiry(property.id); 
                      }}
                    >
                      📧 Inquire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedModal;
