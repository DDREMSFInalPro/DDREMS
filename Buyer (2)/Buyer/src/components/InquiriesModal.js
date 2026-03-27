import React from 'react';
import './Modal.css';

function InquiriesModal({ inquiries, properties, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📧 My Inquiries</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {inquiries.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No inquiries yet
            </p>
          ) : (
            inquiries.map(inquiry => {
              const property = properties.find(p => p.id === inquiry.propertyId);
              return (
                <div key={inquiry.id} className="inquiry-card">
                  <h3>{property?.title}</h3>
                  <p><strong>Date:</strong> {inquiry.date}</p>
                  <p>
                    <strong>Status:</strong> 
                    <span style={{ color: '#ffc107', fontWeight: 600, marginLeft: '5px' }}>
                      {inquiry.status.toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Message:</strong> {inquiry.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default InquiriesModal;
