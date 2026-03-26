/**
 * Profile Page - View and edit owner profile
 */
import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', bio: '', currentPassword: '', newPassword: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileAPI.get();
      const p = res.data.data;
      setProfile(p);
      setFormData({ name: p.name || '', phone: p.phone || '', address: p.address || '', bio: p.bio || '', currentPassword: '', newPassword: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to load profile.'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => { if (formData[k]) data.append(k, formData[k]); });
      await profileAPI.update(data);
      setSuccess('Profile updated successfully.');
      setEditMode(false);
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div><p>Loading profile...</p></div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="page-header__subtitle">View and update your information</p>
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <div className="card">
        <div className="card__header">
          <h3>👤 Profile Information</h3>
          {!editMode && <button className="btn btn--sm btn--outline" onClick={() => setEditMode(true)}>✏️ Edit</button>}
        </div>
        <div className="card__body">
          {editMode ? (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="input" required /></div>
                <div className="form-group"><label htmlFor="phone">Phone</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="input" /></div>
                <div className="form-group form-group--full"><label htmlFor="address">Address</label>
                  <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="input" /></div>
                <div className="form-group form-group--full"><label htmlFor="bio">Bio</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="input"></textarea></div>
              </div>
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Change Password (optional)</h4>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="currentPassword">Current Password</label>
                  <input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="input" /></div>
                <div className="form-group"><label htmlFor="newPassword">New Password</label>
                  <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange} minLength={6} className="input" /></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving} id="btn-save-profile">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-info__avatar">
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} /> :
                <span className="profile-info__avatar-placeholder">{profile?.name?.charAt(0)?.toUpperCase() || 'O'}</span>}
              </div>
              <div className="profile-info__details">
                <div className="profile-info__row"><span className="label">Name:</span><span>{profile?.name}</span></div>
                <div className="profile-info__row"><span className="label">Email:</span><span>{profile?.email}</span></div>
                <div className="profile-info__row"><span className="label">Role:</span><span className="badge badge--info">{profile?.role}</span></div>
                <div className="profile-info__row"><span className="label">Phone:</span><span>{profile?.phone || 'Not set'}</span></div>
                <div className="profile-info__row"><span className="label">Address:</span><span>{profile?.address || 'Not set'}</span></div>
                <div className="profile-info__row"><span className="label">Bio:</span><span>{profile?.bio || 'Not set'}</span></div>
                <div className="profile-info__row"><span className="label">Member since:</span><span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
