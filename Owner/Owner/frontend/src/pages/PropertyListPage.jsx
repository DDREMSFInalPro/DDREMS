/**
 * Property List Page
 * Displays owner's properties with publish/unpublish, edit, delete actions
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { propertyAPI } from '../services/api';

const PropertyListPage = () => {
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [notification, setNotification] = useState('');
  const [imageIndices, setImageIndices] = useState({});
  const navigate = useNavigate();

  const cycleImage = (e, propertyId, direction, totalImages) => {
    e.stopPropagation();
    setImageIndices((prev) => {
      const current = prev[propertyId] || 0;
      let next = current + direction;
      if (next < 0) next = totalImages - 1;
      if (next >= totalImages) next = 0;
      return { ...prev, [propertyId]: next };
    });
  };

  useEffect(() => {
    fetchProperties();
  }, [pagination.page, statusFilter, typeFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getAll({
        page: pagination.page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        propertyType: typeFilter || undefined,
      });
      setProperties(response.data.data.properties);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchProperties();
  };

  const handleTogglePublish = async (id) => {
    try {
      const response = await propertyAPI.togglePublish(id);
      setNotification(response.data.message);
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, isPublished: response.data.data.isPublished, status: response.data.data.status }
            : p
        )
      );
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update listing status.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action can be undone.`)) {
      return;
    }

    try {
      await propertyAPI.delete(id);
      setNotification('Property deleted successfully.');
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete property.');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  return (
    <div className="property-list">
      <div className="page-header">
        <div>
          <h1>My Properties</h1>
          <p className="page-header__subtitle">Manage your property listings</p>
        </div>
        <Link to="/properties/new" className="btn btn--primary" id="btn-add-property">
          ➕ Add Property
        </Link>
      </div>

      {/* Notifications */}
      {notification && <div className="alert alert--success">{notification}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="filters">
          <form onSubmit={handleSearch} className="filters__search">
            <input
              type="text"
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              id="input-search"
            />
            <button type="submit" className="btn btn--primary btn--sm">Search</button>
          </form>
          <div className="filters__selects">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="select"
              id="select-status"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
              className="select"
              id="select-type"
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
              <option value="office">Office</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>🏠</span>
            <h3>No Properties Found</h3>
            <p>Start by adding your first property listing.</p>
            <Link to="/properties/new" className="btn btn--primary">Add Property</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table" id="table-properties">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id} className="table-row--clickable" onClick={() => navigate(`/properties/${property.id}`)}>
                      <td>
                        <div className="property-cell">
                          {property.images?.length > 0 ? (
                            <div className="property-cell__carousel" onClick={(e) => e.stopPropagation()}>
                              <img
                                src={property.images[imageIndices[property.id] || 0]?.imageUrl}
                                alt={property.title}
                                className="property-cell__img"
                              />
                              {property.images.length > 1 && (
                                <>
                                  <button
                                    className="carousel-arrow carousel-arrow--left"
                                    onClick={(e) => cycleImage(e, property.id, -1, property.images.length)}
                                  >‹</button>
                                  <button
                                    className="carousel-arrow carousel-arrow--right"
                                    onClick={(e) => cycleImage(e, property.id, 1, property.images.length)}
                                  >›</button>
                                  <span className="carousel-counter">
                                    {(imageIndices[property.id] || 0) + 1}/{property.images.length}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="property-cell__placeholder">🏠</div>
                          )}
                          <div>
                            <strong className="text-link">{property.title}</strong>
                            <small className="text-muted">{property.address}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--info">{property.propertyType}</span>
                      </td>
                      <td>ETB {Number(property.price).toLocaleString()}</td>
                      <td>
                        <span className={`badge badge--${property.status === 'active' ? 'success' : property.status === 'sold' ? 'purple' : 'warning'}`}>
                          {property.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`toggle-btn ${property.isPublished ? 'toggle-btn--on' : 'toggle-btn--off'}`}
                          onClick={() => handleTogglePublish(property.id)}
                          title={property.isPublished ? 'Unpublish' : 'Publish'}
                          id={`btn-toggle-${property.id}`}
                        >
                          <span className="toggle-btn__slider"></span>
                        </button>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button
                            className="btn btn--sm btn--outline"
                            onClick={() => navigate(`/properties/${property.id}`)}
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            className="btn btn--sm btn--outline"
                            onClick={() => navigate(`/properties/edit/${property.id}`)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn--sm btn--danger"
                            onClick={() => handleDelete(property.id, property.title)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn--sm btn--outline"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                ← Previous
              </button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                className="btn btn--sm btn--outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyListPage;
