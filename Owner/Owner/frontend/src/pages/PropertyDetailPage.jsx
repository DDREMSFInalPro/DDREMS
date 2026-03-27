/**
 * Property Detail Page
 * Shows full property info, images, ownership document, and map location
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { propertyAPI, documentAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getById(id);
      setProperty(response.data.data);

      // Fetch documents
      try {
        const docResponse = await documentAPI.getAll(id);
        setDocuments(docResponse.data.data || []);
      } catch {
        // No docs yet
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load property.');
    } finally {
      setLoading(false);
    }
  };

  const copyAccessKey = async (key, docId) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyId(docId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = key;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedKeyId(docId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📕';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📘';
    if (fileType?.includes('image')) return '🖼️';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'warning',
      active: 'success',
      sold: 'purple',
      rented: 'info',
      withdrawn: 'outline',
    };
    return map[status] || 'outline';
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: '3rem' }}>❌</span>
        <h3>{error || 'Property not found'}</h3>
        <Link to="/properties" className="btn btn--primary">← Back to Properties</Link>
      </div>
    );
  }

  const lat = parseFloat(property.latitude);
  const lng = parseFloat(property.longitude);
  const hasCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  return (
    <div className="property-detail">
      <div className="page-header">
        <div>
          <h1>{property.title}</h1>
          <p className="page-header__subtitle">📍 {property.address}, {property.city}</p>
        </div>
        <div className="action-buttons" style={{ gap: '0.5rem' }}>
          <button className="btn btn--outline" onClick={() => navigate('/properties')}>
            ← Back
          </button>
          <button className="btn btn--primary" onClick={() => navigate(`/properties/edit/${property.id}`)}>
            ✏️ Edit
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column — Images + Info */}
        <div className="detail-grid__left">
          {/* Image Gallery */}
          <div className="card">
            <div className="card__body">
              {property.images && property.images.length > 0 ? (
                <div className="detail-gallery">
                  <div className="detail-gallery__main">
                    <img
                      src={property.images[activeImage]?.imageUrl}
                      alt={property.title}
                      className="detail-gallery__img"
                    />
                  </div>
                  {property.images.length > 1 && (
                    <div className="detail-gallery__thumbs">
                      {property.images.map((img, idx) => (
                        <img
                          key={img.id}
                          src={img.imageUrl}
                          alt={`View ${idx + 1}`}
                          className={`detail-gallery__thumb ${idx === activeImage ? 'detail-gallery__thumb--active' : ''}`}
                          onClick={() => setActiveImage(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="detail-gallery__placeholder">
                  <span style={{ fontSize: '4rem' }}>🏠</span>
                  <p className="text-muted">No images uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Property Info */}
          <div className="card">
            <div className="card__header">
              <h3>📋 Property Details</h3>
              <div className="action-buttons" style={{ gap: '0.4rem' }}>
                <span className="badge badge--info">{property.propertyType}</span>
                <span className={`badge badge--${getStatusBadge(property.status)}`}>{property.status}</span>
              </div>
            </div>
            <div className="card__body">
              {property.description && (
                <p className="detail-description">{property.description}</p>
              )}
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat__icon">💰</span>
                  <div>
                    <span className="detail-stat__value">ETB {Number(property.price).toLocaleString()}</span>
                    <span className="detail-stat__label">{property.listingType === 'rent' ? 'Monthly Rent' : 'Sale Price'}</span>
                  </div>
                </div>
                {property.sizeSqm && (
                  <div className="detail-stat">
                    <span className="detail-stat__icon">📐</span>
                    <div>
                      <span className="detail-stat__value">{property.sizeSqm} sqm</span>
                      <span className="detail-stat__label">Total Area</span>
                    </div>
                  </div>
                )}
                <div className="detail-stat">
                  <span className="detail-stat__icon">🛏️</span>
                  <div>
                    <span className="detail-stat__value">{property.bedrooms}</span>
                    <span className="detail-stat__label">Bedrooms</span>
                  </div>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat__icon">🚿</span>
                  <div>
                    <span className="detail-stat__value">{property.bathrooms}</span>
                    <span className="detail-stat__label">Bathrooms</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="detail-amenities">
                  <h4>Amenities</h4>
                  <div className="detail-amenities__list">
                    {property.amenities.map((amenity, idx) => (
                      <span key={idx} className="detail-amenity-tag">✓ {amenity}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Info */}
              <div className="detail-meta">
                <div className="detail-meta__row">
                  <span className="detail-meta__label">Listing Type</span>
                  <span className="badge badge--info">{property.listingType === 'sale' ? 'For Sale' : 'For Rent'}</span>
                </div>
                <div className="detail-meta__row">
                  <span className="detail-meta__label">Published</span>
                  <span className={`badge ${property.isPublished ? 'badge--success' : 'badge--warning'}`}>
                    {property.isPublished ? 'Yes' : 'No'}
                  </span>
                </div>
                {property.tourUrl3d && (
                  <div className="detail-meta__row">
                    <span className="detail-meta__label">3D Tour</span>
                    <a href={property.tourUrl3d} target="_blank" rel="noopener noreferrer" className="text-link">
                      View Tour →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Map + Documents */}
        <div className="detail-grid__right">
          {/* Map */}
          <div className="card">
            <div className="card__header">
              <h3>🗺️ Location</h3>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {hasCoordinates ? (
                <div className="detail-map">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    style={{ height: '350px', width: '100%', borderRadius: '0 0 16px 16px' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]}>
                      <Popup>
                        <strong>{property.title}</strong><br />
                        {property.address}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="detail-map__placeholder">
                  <span style={{ fontSize: '3rem' }}>📍</span>
                  <p className="text-muted">No coordinates set for this property</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Edit the property and add latitude/longitude to see it on the map
                  </p>
                </div>
              )}
              <div style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  📍 <strong>{property.address}</strong>, {property.city}
                </p>
                {hasCoordinates && (
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ownership Document */}
          {documents.length > 0 && (
            <div className="card doc-upload-card">
              <div className="card__header">
                <h3>🔒 Ownership Certificate</h3>
                <span className="badge badge--warning">Government Issued</span>
              </div>
              <div className="card__body">
                {documents.map((doc) => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-item__info">
                      <div className="doc-item__left">
                        <span className="doc-item__icon">{getFileIcon(doc.fileType)}</span>
                        <div className="doc-item__details">
                          <span className="doc-item__name">{doc.originalName}</span>
                          <span className="doc-item__size">{formatFileSize(doc.fileSizeBytes)}</span>
                        </div>
                      </div>
                      <div className="doc-item__status">
                        <span className="doc-item__lock">{doc.isLocked ? '🔒' : '🔓'}</span>
                        <span className="badge badge--info">
                          {doc.isLocked ? 'Locked' : 'Unlocked'}
                        </span>
                      </div>
                    </div>
                    <div className="doc-item__key-section">
                      <label>Access Key</label>
                      <div className="doc-item__key-row">
                        <code className="doc-item__key">{doc.accessKey}</code>
                        <button
                          type="button"
                          className={`btn btn--sm ${copiedKeyId === doc.id ? 'btn--primary' : 'btn--outline'}`}
                          onClick={() => copyAccessKey(doc.accessKey, doc.id)}
                        >
                          {copiedKeyId === doc.id ? '✅ Copied!' : '📋 Copy Key'}
                        </button>
                        <a
                          href={documentAPI.getDownloadUrl(doc.id, doc.accessKey)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--sm btn--secondary"
                        >
                          📥 Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
