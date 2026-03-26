import React, { useState } from 'react';
import './PurchaseModal.css';

function PurchaseModal({ property, onClose, onPurchase }) {
  const [step, setStep] = useState(1); // 1: Details, 2: Payment Method, 3: Payment Form
  const [paymentMethod, setPaymentMethod] = useState('');
  const [buyerInfo, setBuyerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    idNumber: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    accountNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const formatPrice = (price) => price.toLocaleString('en-US');

  const handleBuyerInfoChange = (e) => {
    const { name, value } = e.target;
    setBuyerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!buyerInfo.fullName || !buyerInfo.email || !buyerInfo.phone || !buyerInfo.address || !buyerInfo.idNumber) {
        alert('Please fill in all buyer information');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }
      setStep(3);
    }
  };

  const handlePurchase = (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'chapa') {
      if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv) {
        alert('Please fill in all card information');
        return;
      }
    } else if (paymentMethod === 'cbe') {
      if (!paymentInfo.accountNumber) {
        alert('Please enter your CBE account number');
        return;
      }
    }

    const purchaseData = {
      property,
      buyerInfo,
      paymentMethod,
      paymentInfo,
      amount: property.price,
      timestamp: new Date().toISOString()
    };

    onPurchase(purchaseData);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content purchase-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏠 Purchase Property</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="purchase-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="progress-circle">1</div>
            <span>Buyer Info</span>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="progress-circle">2</div>
            <span>Payment Method</span>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="progress-circle">3</div>
            <span>Payment</span>
          </div>
        </div>

        <div className="modal-body">
          {/* Property Summary */}
          <div className="property-summary">
            <h3>Property Summary</h3>
            <div className="summary-content">
              <div className="summary-image">
                <img src={property.image} alt={property.title} />
              </div>
              <div className="summary-details">
                <h4>{property.title}</h4>
                <p>📍 {property.location.charAt(0).toUpperCase() + property.location.slice(1)}, Dire Dawa</p>
                <p className="summary-price">{formatPrice(property.price)} ETB</p>
              </div>
            </div>
          </div>

          {/* Step 1: Buyer Information */}
          {step === 1 && (
            <div className="purchase-step">
              <h3>Buyer Information</h3>
              <form className="purchase-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={buyerInfo.fullName}
                    onChange={handleBuyerInfoChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={buyerInfo.email}
                    onChange={handleBuyerInfoChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={buyerInfo.phone}
                    onChange={handleBuyerInfoChange}
                    placeholder="+251 9XX XXX XXX"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={buyerInfo.address}
                    onChange={handleBuyerInfoChange}
                    placeholder="Your current address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ID Number (Passport/National ID) *</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={buyerInfo.idNumber}
                    onChange={handleBuyerInfoChange}
                    placeholder="Enter your ID number"
                    required
                  />
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === 2 && (
            <div className="purchase-step">
              <h3>Select Payment Method</h3>
              <div className="payment-methods">
                <div 
                  className={`payment-method-card ${paymentMethod === 'chapa' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('chapa')}
                >
                  <div className="payment-icon">💳</div>
                  <h4>Chapa Payment</h4>
                  <p>Pay with credit/debit card via Chapa</p>
                  <ul>
                    <li>✓ Secure payment gateway</li>
                    <li>✓ Instant confirmation</li>
                    <li>✓ All major cards accepted</li>
                  </ul>
                </div>
                <div 
                  className={`payment-method-card ${paymentMethod === 'cbe' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cbe')}
                >
                  <div className="payment-icon">🏦</div>
                  <h4>CBE Bank Transfer</h4>
                  <p>Commercial Bank of Ethiopia</p>
                  <ul>
                    <li>✓ Direct bank transfer</li>
                    <li>✓ Secure & reliable</li>
                    <li>✓ No transaction fees</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Form */}
          {step === 3 && (
            <div className="purchase-step">
              <h3>Payment Details</h3>
              <form className="purchase-form" onSubmit={handlePurchase}>
                {paymentMethod === 'chapa' && (
                  <>
                    <div className="payment-header">
                      <img src="https://chapa.co/favicon.ico" alt="Chapa" style={{ width: '30px', marginRight: '10px' }} />
                      <span>Chapa Secure Payment</span>
                    </div>
                    <div className="form-group">
                      <label>Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentInfo.cardNumber}
                        onChange={handlePaymentInfoChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date *</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentInfo.expiryDate}
                          onChange={handlePaymentInfoChange}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV *</label>
                        <input
                          type="text"
                          name="cvv"
                          value={paymentInfo.cvv}
                          onChange={handlePaymentInfoChange}
                          placeholder="123"
                          maxLength="3"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === 'cbe' && (
                  <>
                    <div className="payment-header">
                      <div className="cbe-logo">🏦 CBE</div>
                      <span>Commercial Bank of Ethiopia</span>
                    </div>
                    <div className="form-group">
                      <label>CBE Account Number *</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={paymentInfo.accountNumber}
                        onChange={handlePaymentInfoChange}
                        placeholder="Enter your CBE account number"
                        required
                      />
                    </div>
                    <div className="cbe-info">
                      <p><strong>Bank Details:</strong></p>
                      <p>Bank Name: Commercial Bank of Ethiopia</p>
                      <p>Account Name: Dire Dawa Real Estate</p>
                      <p>Account Number: 1000XXXXXXXX</p>
                      <p className="info-note">
                        ℹ️ You will be redirected to CBE Birr for secure payment processing
                      </p>
                    </div>
                  </>
                )}

                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Property Price:</span>
                    <strong>{formatPrice(property.price)} ETB</strong>
                  </div>
                  <div className="summary-row">
                    <span>Processing Fee:</span>
                    <strong>{formatPrice(property.price * 0.02)} ETB</strong>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <strong>{formatPrice(property.price * 1.02)} ETB</strong>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                  💳 Complete Purchase
                </button>
              </form>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="purchase-actions">
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}
            {step < 3 && (
              <button className="btn btn-primary" onClick={handleNextStep}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseModal;
