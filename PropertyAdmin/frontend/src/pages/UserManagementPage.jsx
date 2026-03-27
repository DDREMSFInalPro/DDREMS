import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ role: '', search: '', isActive: '', page: 1 });

  useEffect(() => { fetchUsers(); }, [filters.page, filters.role, filters.isActive]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20 };
      if (filters.role) params.role = filters.role;
      if (filters.isActive) params.isActive = filters.isActive;
      if (filters.search) params.search = filters.search;
      const res = await userAPI.getAll(params);
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchUsers(); };

  const toggleActive = async (userId) => {
    try {
      const res = await userAPI.toggleActive(userId);
      setUsers(users.map((u) => u.id === userId ? { ...u, isActive: res.data.data.isActive } : u));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="users-page">
      <div className="page-header"><h1>User Management</h1><p>Manage all system users</p></div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="toolbar__search">
          <input type="text" placeholder="Search users..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} id="input-search-users" />
          <button type="submit" className="btn btn--primary btn--sm">Search</button>
        </form>
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })} id="select-role">
          <option value="">All Roles</option>
          <option value="owner">Owners</option>
          <option value="buyer">Buyers</option>
          <option value="admin">Admins</option>
        </select>
        <select value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })} id="select-status">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner"></div></div> : users.length === 0 ? <div className="empty-state"><h3>No users found</h3></div> : (
        <>
          <div className="table-responsive"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.phone || '—'}</td>
                <td><span className="badge badge--info">{u.role}</span></td>
                <td><span className={`badge ${u.isActive ? 'badge--success' : 'badge--danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td><button className={`btn btn--sm ${u.isActive ? 'btn--danger' : 'btn--primary'}`} onClick={() => toggleActive(u.id)}>{u.isActive ? 'Deactivate' : 'Activate'}</button></td>
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

export default UserManagementPage;
