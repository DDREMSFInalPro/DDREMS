/**
 * Browse Properties Page (Buyer Module)
 * Grid of published properties with search/filter and save functionality
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyAPI, savedAPI } from '../services/api';

const BrowsePropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    listingType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    fetchProperties();
    fetchSavedIds();
  }, [filters.page, filters.sortBy, filters.sortOrder]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '') params[key] = val;
      });
      const res = await propertyAPI.browse(params);
      setProperties(res.data.data.properties);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedIds = async () => {
    try {
      const res = await savedAPI.getIds();
      setSavedIds(res.data.data.savedIds);
    } catch (err) {
      console.error('Failed to load saved IDs:', err);
    }
  };

  const handleFilter = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const toggleSave = async (propertyId, e) => {
    e.stopPropagation();
    try {
      if (savedIds.includes(propertyId)) {
        await savedAPI.unsave(propertyId);
        setSavedIds(savedIds.filter((id) => id !== propertyId));
      } else {
        await savedAPI.save(propertyId);
        setSavedIds([...savedIds, propertyId]);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.isPrimary);
    return primary ? primary.imageUrl : images[0].imageUrl;
  };

  return (
    <div className="browse-page">
      <div className="page-header">
        <h1>Browse Properties</h1>
        <p>Find your dream property in Dire Dawa</p>
      </div>

      {/* Filters */}
      <form className="filters-bar" onSubmit={applyFilters}>
        <div className="filters-bar__row">
          <input
            type="text"
            name="search"
            placeholder="Search properties..."
            value={filters.search}
            onChange={handleFilter}
            className="filters-bar__search"
            id="input-search"
          />
          <select name="propertyType" value={filters.propertyType} onChange={handleFilter} id="select-property-type">
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
            <option value="office">Office</option>
          </select>
          <select name="listingType" value={filters.listingType} onChange={handleFilter} id="select-listing-type">
            <option value="">Sale & Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilter}
            className="filters-bar__price"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilter}
            className="filters-bar__price"
          />
          <select name="bedrooms" value={filters.bedrooms} onChange={handleFilter} id="select-bedrooms">
            <option value="">Any Beds</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          <button type="submit" className="btn btn--primary" id="btn-apply-filters">Search</button>
        </div>
        <div className="filters-bar__sort">
          <label>Sort by:</label>
          <select name="sortBy" value={filters.sortBy} onChange={handleFilter} id="select-sort">
            <option value="createdAt">Newest</option>
            <option value="price">Price</option>
            <option value="sizeSqm">Size</option>
            <option value="bedrooms">Bedrooms</option>
          </select>
          <select name="sortOrder" value={filters.sortOrder} onChange={handleFilter} id="select-order">
            <option value="DESC">High to Low</option>
            <option value="ASC">Low to High</option>
          </select>
        </div>
      </form>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div><p>Loading properties...</p></div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <h3>No properties found</h3>
          <p>Try adjusting your search filters.</p>
        </div>
      ) : (
        <>
          <div className="property-grid">
            {properties.map((property) => (
              <div key={property.id} className="property-card" onClick={() => navigate(`/browse/${property.id}`)} id={`property-${property.id}`}>
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
                    className={`property-card__save ${savedIds.includes(property.id) ? 'property-card__save--active' : ''}`}
                    onClick={(e) => toggleSave(property.id, e)}
                    title={savedIds.includes(property.id) ? 'Unsave' : 'Save'}
                  >
                    {savedIds.includes(property.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="property-card__body">
                  <h3 className="property-card__title">{property.title}</h3>
                  <p className="property-card__address">📍 {property.address}</p>
                  <div className="property-card__meta">
                    <span>🏠 {property.propertyType}</span>
                    {property.bedrooms > 0 && <span>🛏 {property.bedrooms} bed</span>}
                    {property.bathrooms > 0 && <span>🚿 {property.bathrooms} bath</span>}
                    {property.sizeSqm && <span>📐 {property.sizeSqm} sqm</span>}
                  </div>
                  <div className="property-card__price">
                    ETB {Number(property.price).toLocaleString()}
                    {property.listingType === 'rent' && <span>/month</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn--outline"
                disabled={pagination.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} properties)
              </span>
              <button
                className="btn btn--outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowsePropertiesPage;
