import React from 'react';
import './PurchaseSuccessModal.css';

function PurchaseSuccessModal({ purchaseData, onClose }) {
  const formatPrice = (price) => price.toLocaleString('en-US');

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content success-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="success-animation">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <h2 className="success-title">🎉 Purchase Successful!</h2>
          <p className="success-message">
            Congratulations! Your property purchase has been processed successfully.
          </p>

          <div className="purchase-details">
            <h3>Purchase Details</h3>
            <div className="detail-row">
              <span>Property:</span>
              <strong>{purchaseData.property.title}</strong>
            </div>
            <div className="detail-row">
              <span>Location:</span>
              <strong>{purchaseData.property.location.charAt(0).toUpperCase() + purchaseData.property.location.slice(1)}, Dire Dawa</strong>
            </div>
            <div className="detail-row">
              <span>Amount Paid:</span>
              <strong className="amount">{formatPrice(purchaseData.amount * 1.02)} ETB</strong>
            </div>
            <div className="detail-row">
              <span>Payment Method:</span>
              <strong>{purchaseData.paymentMethod === 'chapa' ? 'Chapa Payment' : 'CBE Bank Transfer'}</strong>
            </div>
            <div className="detail-row">
              <span>Transaction ID:</span>
              <strong>TXN-{Date.now()}</strong>
            </div>
            <div className="detail-row">
              <span>Date:</span>
              <strong>{new Date(purchaseData.timestamp).toLocaleString()}</strong>
            </div>
          </div>

          <div className="buyer-details">
            <h3>Buyer Information</h3>
            <div className="detail-row">
              <span>Name:</span>
              <strong>{purchaseData.buyerInfo.fullName}</strong>
            </div>
            <div className="detail-row">
              <span>Email:</span>
              <strong>{purchaseData.buyerInfo.email}</strong>
            </div>
            <div className="detail-row">
              <span>Phone:</span>
              <strong>{purchaseData.buyerInfo.phone}</strong>
            </div>
          </div>

          <div className="next-steps">
            <h3>📋 Next Steps</h3>
            <ul>
              <li>✓ A confirmation email has been sent to {purchaseData.buyerInfo.email}</li>
              <li>✓ Our team will contact you within 24 hours</li>
              <li>✓ Property documents will be prepared for signing</li>
              <li>✓ Schedule a property viewing appointment</li>
              <li>✓ Complete legal documentation process</li>
            </ul>
          </div>

          <div className="success-actions">
            <button className="btn btn-primary" onClick={onClose}>
              ✓ Done
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseSuccessModal;
