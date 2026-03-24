/**
 * Saved Properties Page (Buyer Module)
 * Grid of saved/favorited properties
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { savedAPI } from '../services/api';

const SavedPropertiesPage = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSaved();
  }, [page]);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await savedAPI.getAll({ page, limit: 12 });
      setSavedItems(res.data.data.savedProperties);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load saved properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (propertyId, e) => {
    e.stopPropagation();
    try {
      await savedAPI.unsave(propertyId);
      setSavedItems(savedItems.filter((item) => item.property?.id !== propertyId));
    } catch (err) {
      console.error('Failed to unsave:', err);
    }
  };

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.isPrimary);
    return primary ? primary.imageUrl : images[0].imageUrl;
  };

  return (
    <div className="saved-page">
      <div className="page-header">
        <h1>Saved Properties</h1>
        <p>Your favorite properties</p>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div><p>Loading saved properties...</p></div>
      ) : savedItems.length === 0 ? (
        <div className="empty-state">
          <h3>No saved properties</h3>
          <p>Browse properties and save your favorites!</p>
          <button className="btn btn--primary" onClick={() => navigate('/browse')}>Browse Properties</button>
        </div>
      ) : (
        <>
          <div className="property-grid">
            {savedItems.map((item) => {
              const property = item.property;
              if (!property) return null;
              return (
                <div key={item.id} className="property-card" onClick={() => navigate(`/browse/${property.id}`)}>
                  <div className="property-card__image">
                    {getPrimaryImage(property.images) ? (
                      <img src={getPrimaryImage(property.images)} alt={property.title} />
                    ) : (
                      <div className="property-card__placeholder">🏠</div>
                    )}
                    <span className={`property-card__badge property-card__badge--${property.listingType}`}>
                      For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
                    </span>
                    <button
                      className="property-card__save property-card__save--active"
                      onClick={(e) => handleUnsave(property.id, e)}
                      title="Remove from saved"
                    >
                      ❤️
                    </button>
                  </div>
                  <div className="property-card__body">
                    <h3 className="property-card__title">{property.title}</h3>
                    <p className="property-card__address">📍 {property.address}</p>
                    <div className="property-card__meta">
                      <span>🏠 {property.propertyType}</span>
                      {property.bedrooms > 0 && <span>🛏 {property.bedrooms} bed</span>}
                      {property.bathrooms > 0 && <span>🚿 {property.bathrooms} bath</span>}
                    </div>
                    <div className="property-card__price">
                      ETB {Number(property.price).toLocaleString()}
                      {property.listingType === 'rent' && <span>/month</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn--outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="pagination__info">Page {pagination.page} of {pagination.totalPages}</span>
              <button className="btn btn--outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SavedPropertiesPage;
