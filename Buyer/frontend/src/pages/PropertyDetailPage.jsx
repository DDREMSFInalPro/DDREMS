/**
 * Property Detail Page (Buyer Module)
 * Full property details with image carousel and agreement request
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyAPI, agreementAPI, savedAPI } from '../services/api';
import api from '../services/api';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    agreementType: 'sale',
    terms: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    salePrice: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [aiVerdict, setAiVerdict] = useState(null);

  useEffect(() => {
    fetchProperty();
    checkIfSaved();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await propertyAPI.getById(id);
      setProperty(res.data.data);
      if (res.data.data.listingType) {
        setRequestForm((prev) => ({ ...prev, agreementType: res.data.data.listingType === 'rent' ? 'rental' : 'sale' }));
      }
      // Fetch AI verdict in background
      try {
        const aiRes = await api.get(`/ai/recommend/${id}`);
        setAiVerdict(aiRes.data.data);
      } catch (_) {}
    } catch (err) {
      console.error('Failed to load property:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const res = await savedAPI.getIds();
      setIsSaved(res.data.data.savedIds.includes(id));
    } catch (err) {
      console.error('Failed to check saved status:', err);
    }
  };

  const toggleSave = async () => {
    try {
      if (isSaved) {
        await savedAPI.unsave(id);
        setIsSaved(false);
      } else {
        await savedAPI.save(id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleRequestChange = (e) => {
    setRequestForm({ ...requestForm, [e.target.name]: e.target.value });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        propertyId: id,
        agreementType: requestForm.agreementType,
        terms: requestForm.terms || undefined,
        startDate: requestForm.startDate || undefined,
        endDate: requestForm.endDate || undefined,
      };

      if (requestForm.agreementType === 'rental') {
        data.monthlyRent = requestForm.monthlyRent ? parseFloat(requestForm.monthlyRent) : parseFloat(property.price);
      } else {
        data.salePrice = requestForm.salePrice ? parseFloat(requestForm.salePrice) : parseFloat(property.price);
      }

      await agreementAPI.request(data);
      setMessage({ type: 'success', text: 'Agreement request submitted successfully! The admin will review it.' });
      setShowRequestModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading property...</p></div>;
  if (!property) return <div className="empty-state"><h3>Property not found</h3><button className="btn btn--primary" onClick={() => navigate('/browse')}>Back to Browse</button></div>;

  const images = property.images || [];
  const sortedImages = [...images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="property-detail">
      <button className="btn btn--outline btn--back" onClick={() => navigate('/browse')}>← Back to Browse</button>

      {/* Image Carousel */}
      <div className="carousel">
        {sortedImages.length > 0 ? (
          <>
            <div className="carousel__main">
              <img src={sortedImages[currentImageIndex]?.imageUrl} alt={property.title} />
              {sortedImages.length > 1 && (
                <>
                  <button className="carousel__btn carousel__btn--prev" onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1))}>‹</button>
                  <button className="carousel__btn carousel__btn--next" onClick={() => setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1))}>›</button>
                  <span className="carousel__counter">{currentImageIndex + 1} / {sortedImages.length}</span>
                </>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="carousel__thumbs">
                {sortedImages.map((img, idx) => (
                  <img
                    key={img.id}
                    src={img.imageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`carousel__thumb ${idx === currentImageIndex ? 'carousel__thumb--active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="carousel__placeholder">🏠 No images available</div>
        )}
      </div>

      {/* Property Info */}
      <div className="property-detail__content">
        <div className="property-detail__main">
          <div className="property-detail__header">
            <div>
              <h1>{property.title}</h1>
              <p className="property-detail__address">📍 {property.address}, {property.city}</p>
            </div>
            <div className="property-detail__actions">
              <button className={`btn ${isSaved ? 'btn--danger' : 'btn--outline'}`} onClick={toggleSave} id="btn-save-property">
                {isSaved ? '❤️ Saved' : '🤍 Save'}
              </button>
              <button className="btn btn--primary" onClick={() => setShowRequestModal(true)} id="btn-request-agreement">
                📄 Request Agreement
              </button>
            </div>
          </div>

          <div className="property-detail__price">
            <span className="property-detail__price-value">ETB {Number(property.price).toLocaleString()}</span>
            {property.listingType === 'rent' && <span className="property-detail__price-period">/month</span>}
            <span className={`badge badge--${property.listingType === 'sale' ? 'success' : 'info'}`}>
              For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
            </span>
          </div>

          {/* AI Verdict Badge */}
          {aiVerdict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0', padding: '0.75rem 1rem', borderRadius: '10px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '1.1rem' }}>🤖</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, color: aiVerdict.verdict.color, marginRight: '0.5rem' }}>{aiVerdict.verdict.label}</span>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{aiVerdict.verdict.message}</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>AI Est: ETB {Number(aiVerdict.recommendedPrice).toLocaleString()}</span>
              <button className="btn btn--sm btn--outline" onClick={() => navigate('/ai-price')} style={{ whiteSpace: 'nowrap' }}>Full Analysis</button>
            </div>
          )}

          <div className="property-detail__specs">
            <div className="spec-item"><span className="spec-item__icon">🏠</span><span>{property.propertyType}</span></div>
            {property.bedrooms > 0 && <div className="spec-item"><span className="spec-item__icon">🛏</span><span>{property.bedrooms} Bedrooms</span></div>}
            {property.bathrooms > 0 && <div className="spec-item"><span className="spec-item__icon">🚿</span><span>{property.bathrooms} Bathrooms</span></div>}
            {property.sizeSqm && <div className="spec-item"><span className="spec-item__icon">📐</span><span>{property.sizeSqm} sqm</span></div>}
          </div>

          {property.description && (
            <div className="property-detail__section">
              <h3>Description</h3>
              <p>{property.description}</p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="property-detail__section">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {property.amenities.map((a, i) => (
                  <span key={i} className="amenity-tag">✓ {a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Owner Info */}
        <div className="property-detail__sidebar">
          <div className="card">
            <div className="card__header"><h3>Listed By</h3></div>
            <div className="card__body">
              <p><strong>{property.owner?.name || 'Owner'}</strong></p>
              {property.owner?.phone && <p>📞 {property.owner.phone}</p>}
              {property.owner?.email && <p>✉️ {property.owner.email}</p>}
            </div>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert--${message.type}`}>{message.text}</div>
      )}

      {/* Agreement Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Request Agreement</h2>
              <button className="modal__close" onClick={() => setShowRequestModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="modal__body">
              <div className="form-group">
                <label>Agreement Type</label>
                <select name="agreementType" value={requestForm.agreementType} onChange={handleRequestChange}>
                  <option value="sale">Sale</option>
                  <option value="rental">Rental</option>
                </select>
              </div>

              {requestForm.agreementType === 'rental' ? (
                <>
                  <div className="form-group">
                    <label>Monthly Rent (ETB)</label>
                    <input type="number" name="monthlyRent" value={requestForm.monthlyRent} onChange={handleRequestChange} placeholder={`Default: ${Number(property.price).toLocaleString()}`} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input type="date" name="startDate" value={requestForm.startDate} onChange={handleRequestChange} />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input type="date" name="endDate" value={requestForm.endDate} onChange={handleRequestChange} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Offer Price (ETB)</label>
                  <input type="number" name="salePrice" value={requestForm.salePrice} onChange={handleRequestChange} placeholder={`Default: ${Number(property.price).toLocaleString()}`} />
                </div>
              )}

              <div className="form-group">
                <label>Additional Terms (Optional)</label>
                <textarea name="terms" value={requestForm.terms} onChange={handleRequestChange} rows={3} placeholder="Any specific terms or conditions..." />
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={submitting} id="btn-submit-agreement">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
