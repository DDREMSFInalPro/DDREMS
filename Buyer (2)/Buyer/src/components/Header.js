import React from 'react';
import './Header.css';

function Header({ savedCount, onOpenSaved, onOpenInquiries }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>🏢 Dire Dawa Real Estate</h1>
          <p>Property Buyer Portal - Find Your Dream Property</p>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={onOpenSaved}>
            ❤️ Saved ({savedCount})
          </button>
          <button className="header-btn" onClick={onOpenInquiries}>
            📧 My Inquiries
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
