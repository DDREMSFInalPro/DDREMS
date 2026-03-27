import React, { useState } from 'react';
import './Modal.css';

function InquiryModal({ propertyId, properties, onClose, onSubmit }) {
  const property = properties.find(p => p.id === propertyId);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `I'm interested in the ${property?.title} property located in ${property?.location}. Please provide more information.`
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Inquiry</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Message *</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required 
                placeholder="I'm interested in this property..."
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Send Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InquiryModal;
