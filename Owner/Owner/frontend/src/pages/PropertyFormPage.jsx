/**
 * Property Form Page
 * Add/Edit property with image upload, document upload, and AI price suggestion
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propertyAPI, aiAPI, documentAPI } from '../services/api';

const PropertyFormPage = () => {
  const { id } = useParams(); // If present, we're in edit mode
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    sizeSqm: '',
    bedrooms: 0,
    bathrooms: 0,
    address: '',
    city: 'Dire Dawa',
    latitude: '',
    longitude: '',
    tourUrl3d: '',
    amenities: '',
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [replacingDoc, setReplacingDoc] = useState(false);

  // Fetch property data if editing
  useEffect(() => {
    if (isEditMode) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setFetchLoading(true);
      const response = await propertyAPI.getById(id);
      const prop = response.data.data;
      setFormData({
        title: prop.title || '',
        description: prop.description || '',
        propertyType: prop.propertyType || 'apartment',
        listingType: prop.listingType || 'sale',
        price: prop.price || '',
        sizeSqm: prop.sizeSqm || '',
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0,
        address: prop.address || '',
        city: prop.city || 'Dire Dawa',
        latitude: prop.latitude || '',
        longitude: prop.longitude || '',
        tourUrl3d: prop.tourUrl3d || '',
        amenities: prop.amenities?.join(', ') || '',
      });
      setExistingImages(prop.images || []);

      // Fetch existing documents
      try {
        const docResponse = await documentAPI.getAll(id);
        setExistingDocuments(docResponse.data.data || []);
      } catch {
        // Documents may not exist yet
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load property.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);
  };

  /**
   * Copy access key to clipboard
   */
  const copyAccessKey = async (key, docId) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyId(docId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch {
      // Fallback for older browsers
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

  /**
   * Fetch AI price recommendation
   */
  const handleGetAIPrice = async () => {
    if (!formData.propertyType || !formData.listingType || !formData.sizeSqm) {
      setError('Please fill in property type, listing type, and size to get a price recommendation.');
      return;
    }

    try {
      setAiLoading(true);
      setError('');
      const response = await aiAPI.getRecommendation({
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        sizeSqm: formData.sizeSqm,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        city: formData.city,
        address: formData.address,
      });

      const result = response.data.data;
      setAiResult(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get price recommendation.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIPrice = () => {
    if (aiResult?.recommendedPrice) {
      setFormData((prev) => ({ ...prev, price: aiResult.recommendedPrice }));
      setAiResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (key === 'amenities') {
          // Convert comma-separated string to individual entries
          const amenitiesArr = formData.amenities
            .split(',')
            .map((a) => a.trim())
            .filter((a) => a);
          amenitiesArr.forEach((a) => data.append('amenities[]', a));
        } else if (formData[key] !== '' && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      // Append images
      images.forEach((file) => {
        data.append('images', file);
      });

      let propertyId;

      if (isEditMode) {
        await propertyAPI.update(id, data);
        propertyId = id;
      } else {
        const response = await propertyAPI.create(data);
        propertyId = response.data.data.id;
      }

      // Upload ownership document if selected (delete old one if replacing)
      if (documents.length > 0 && propertyId) {
        // Delete existing documents first if replacing
        if (replacingDoc && existingDocuments.length > 0) {
          for (const doc of existingDocuments) {
            await documentAPI.delete(doc.id);
          }
        }
        const docData = new FormData();
        documents.forEach((file) => {
          docData.append('documents', file);
        });
        await documentAPI.upload(propertyId, docData);
      }

      navigate('/properties');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.map((e) => e.msg).join(', ') ||
        'Failed to save property.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get file type icon
   */
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📕';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📘';
    if (fileType?.includes('image')) return '🖼️';
    return '📄';
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (fetchLoading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading property...</p>
      </div>
    );
  }

  return (
    <div className="property-form-page">
      <div className="page-header">
        <div>
          <h1>{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
          <p className="page-header__subtitle">
            {isEditMode ? 'Update your property details' : 'List a new property on the platform'}
          </p>
        </div>
        <button className="btn btn--outline" onClick={() => navigate('/properties')}>
          ← Back to Properties
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="property-form" encType="multipart/form-data">
        {/* Basic Information */}
        <div className="card">
          <div className="card__header">
            <h3>📝 Basic Information</h3>
          </div>
          <div className="card__body">
            <div className="form-grid">
              <div className="form-group form-group--full">
                <label htmlFor="title">Property Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Modern 3-Bedroom Apartment in Kezira"
                  required
                  className="input"
                />
              </div>

              <div className="form-group form-group--full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the property features, neighborhood, etc."
                  rows={4}
                  className="input"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="propertyType">Property Type *</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                  className="select"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                  <option value="office">Office</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="listingType">Listing Type *</label>
                <select
                  id="listingType"
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleChange}
                  required
                  className="select"
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing with AI */}
        <div className="card">
          <div className="card__header">
            <h3>💰 Pricing</h3>
          </div>
          <div className="card__body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">Price (ETB) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  required
                  min="0"
                  step="0.01"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label>AI Price Recommendation</label>
                <button
                  type="button"
                  className="btn btn--secondary btn--full"
                  onClick={handleGetAIPrice}
                  disabled={aiLoading}
                  id="btn-ai-price"
                >
                  {aiLoading ? '🔄 Analyzing...' : '🤖 Get AI Price Suggestion'}
                </button>
              </div>
            </div>

            {/* AI Result Display */}
            {aiResult && (
              <div className="ai-result">
                <div className="ai-result__header">
                  <span>🤖 AI Recommended Price</span>
                  <span className="ai-result__source">
                    Source: {aiResult.source === 'ai_model' ? 'AI Model' : 'Rule-based estimate'}
                  </span>
                </div>
                <div className="ai-result__price">
                  ETB {Number(aiResult.recommendedPrice).toLocaleString()}
                </div>
                <div className="ai-result__confidence">
                  Confidence: {Math.round(aiResult.confidence * 100)}%
                </div>
                {aiResult.details && (
                  <p className="ai-result__details">{aiResult.details}</p>
                )}
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={applyAIPrice}
                >
                  ✅ Apply This Price
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="card">
          <div className="card__header">
            <h3>📐 Property Details</h3>
          </div>
          <div className="card__body">
            <div className="form-grid form-grid--4">
              <div className="form-group">
                <label htmlFor="sizeSqm">Size (sqm)</label>
                <input
                  type="number"
                  id="sizeSqm"
                  name="sizeSqm"
                  value={formData.sizeSqm}
                  onChange={handleChange}
                  placeholder="Area in sqm"
                  min="0"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bathrooms">Bathrooms</label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="tourUrl3d">3D Tour URL</label>
                <input
                  type="url"
                  id="tourUrl3d"
                  name="tourUrl3d"
                  value={formData.tourUrl3d}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="input"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="amenities">Amenities (comma-separated)</label>
              <input
                type="text"
                id="amenities"
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                placeholder="e.g., Parking, Swimming Pool, Gym, Security"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <div className="card__header">
            <h3>📍 Location</h3>
          </div>
          <div className="card__body">
            <div className="form-grid">
              <div className="form-group form-group--full">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Full property address"
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="latitude">Latitude</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g., 9.601"
                  className="input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="longitude">Longitude</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g., 41.854"
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <div className="card__header">
            <h3>📷 Images</h3>
          </div>
          <div className="card__body">
            {/* Existing images (edit mode) */}
            {existingImages.length > 0 && (
              <div className="existing-images">
                <label>Current Images</label>
                <div className="image-preview-grid">
                  {existingImages.map((img) => (
                    <div key={img.id} className="image-preview">
                      <img src={img.imageUrl} alt="Property" />
                      {img.isPrimary && <span className="image-preview__badge">Primary</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="images">
                {isEditMode ? 'Add More Images' : 'Upload Images'} (JPEG, PNG, WebP — max 20 files)
              </label>
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="input input--file"
              />
              {images.length > 0 && (
                <p className="text-muted">{images.length} file(s) selected</p>
              )}
            </div>
          </div>
        </div>

        {/* Ownership Document (Locked) */}
        <div className="card doc-upload-card">
          <div className="card__header">
            <h3>🔒 Ownership Document</h3>
            <span className="badge badge--warning">Government Issued</span>
          </div>
          <div className="card__body">
            <p className="doc-upload__description">
              Upload the government-issued ownership certificate for this property. 
              Each document will be <strong>securely locked</strong> with a unique access key. 
              Only you and authorized administrators can view the key.
            </p>

            {/* Existing documents (edit mode) */}
            {existingDocuments.length > 0 && !replacingDoc && (
              <div className="doc-list">
                <label className="doc-list__title">Uploaded Certificate</label>
                {existingDocuments.map((doc) => (
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
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn btn--sm btn--outline"
                        onClick={() => setReplacingDoc(true)}
                      >
                        ✏️ Replace Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show upload area: new property OR replacing existing */}
            {(existingDocuments.length === 0 || replacingDoc) && (
              <div className="form-group">
                <label htmlFor="documents">
                  {replacingDoc ? 'Replace Ownership Certificate' : 'Upload Ownership Certificate'} (PDF, DOC, DOCX, JPG, PNG)
                </label>
                {replacingDoc && (
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    ⚠️ The old certificate will be deleted and replaced with the new one.
                  </p>
                )}
                <div className="doc-upload__dropzone">
                  <input
                    type="file"
                    id="documents"
                    name="documents"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png"
                    onChange={handleDocumentChange}
                    className="doc-upload__input"
                  />
                  <div className="doc-upload__placeholder">
                    <span className="doc-upload__placeholder-icon">📄</span>
                    <span>Drag & drop your ownership certificate here or click to browse</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>Max file size: 10MB</span>
                  </div>
                </div>
                {documents.length > 0 && (
                  <div className="doc-upload__selected">
                    {documents.map((file, idx) => (
                      <div key={idx} className="doc-upload__selected-item">
                        <span>{getFileIcon(file.type)}</span>
                        <span>{file.name}</span>
                        <span className="text-muted">{formatFileSize(file.size)}</span>
                        <span className="doc-upload__lock-badge">🔒 Will be locked</span>
                      </div>
                    ))}
                  </div>
                )}
                {replacingDoc && (
                  <button
                    type="button"
                    className="btn btn--sm btn--outline"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => { setReplacingDoc(false); setDocuments([]); }}
                  >
                    ← Cancel Replace
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => navigate('/properties')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            id="btn-save-property"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Property' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFormPage;
