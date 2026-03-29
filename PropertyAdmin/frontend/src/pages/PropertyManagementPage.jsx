import { useState, useEffect } from 'react';
import { propertyAPI } from '../services/api';

const PropertyManagementPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', propertyType: '', status: '', page: 1 });

  useEffect(() => { fetchProperties(); }, [filters.page, filters.propertyType, filters.status]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.propertyType) params.propertyType = filters.propertyType;
      if (filters.status) params.status = filters.status;
      const res = await propertyAPI.getAll(params);
      setProperties(res.data.data.properties);
      setPagination(res.data.data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const togglePublish = async (id) => {
    try {
      const res = await propertyAPI.togglePublish(id);
      setProperties(properties.map((p) => p.id === id ? { ...p, isPublished: res.data.data.isPublished, status: res.data.data.status } : p));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const getPrimaryImage = (images) => {
    if (!images?.length) return null;
    return (images.find((i) => i.isPrimary) || images[0])?.imageUrl;
  };

  return (
    <div className="properties-page">
      <div className="page-header"><h1>Property Management</h1><p>Manage all system properties</p></div>

      <div className="toolbar">
        <form onSubmit={(e) => { e.preventDefault(); fetchProperties(); }} className="toolbar__search">
          <input type="text" placeholder="Search properties..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} id="input-search-properties" />
          <button type="submit" className="btn btn--primary btn--sm">Search</button>
        </form>
        <select value={filters.propertyType} onChange={(e) => setFilters({ ...filters, propertyType: e.target.value, page: 1 })} id="select-type">
          <option value="">All Types</option><option value="apartment">Apartment</option><option value="house">House</option><option value="villa">Villa</option><option value="commercial">Commercial</option><option value="land">Land</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} id="select-status">
          <option value="">All Status</option>
          <option value="pending_approval">⏳ Pending Approval</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner"></div></div> : properties.length === 0 ? <div className="empty-state"><h3>No properties found</h3></div> : (
        <>
          <div className="table-responsive"><table className="table"><thead><tr><th>Property</th><th>Owner</th><th>Type</th><th>Price</th><th>Status</th><th>Published</th><th>Actions</th></tr></thead>
            <tbody>{properties.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="property-cell">
                    {getPrimaryImage(p.images) ? <img src={getPrimaryImage(p.images)} alt="" className="property-cell__img" /> : <div className="property-cell__placeholder">🏠</div>}
                    <div><strong>{p.title}</strong><br /><small>{p.address}</small></div>
                  </div>
                </td>
                <td>{p.owner?.name || 'N/A'}<br /><small>{p.owner?.email}</small></td>
                <td className="capitalize">{p.propertyType}</td>
                <td>ETB {Number(p.price).toLocaleString()}</td>
                <td><span className={`badge badge--${
                  p.status === 'active' ? 'success' :
                  p.status === 'pending_approval' ? 'warning' :
                  p.status === 'draft' ? 'default' : 'info'
                }`}>{p.status === 'pending_approval' ? '⏳ Pending Approval' : p.status}</span></td>
                <td><span className={`badge ${p.isPublished ? 'badge--success' : 'badge--danger'}`}>{p.isPublished ? 'Yes' : 'No'}</span></td>
                <td>
                  {p.status === 'pending_approval' ? (
                    <button className="btn btn--sm btn--success" onClick={() => togglePublish(p.id)}>✅ Approve & Publish</button>
                  ) : (
                    <button className={`btn btn--sm ${p.isPublished ? 'btn--danger' : 'btn--primary'}`} onClick={() => togglePublish(p.id)}>{p.isPublished ? 'Unpublish' : 'Publish'}</button>
                  )}
                </td>
              </tr>
            ))}</tbody></table></div>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn--outline" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              <span className="pagination__info">Page {pagination.page} of {pagination.totalPages}</span>
              <button className="btn btn--outline" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyManagementPage;
