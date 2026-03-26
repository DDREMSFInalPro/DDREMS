/**
 * Profile Page (Buyer Module)
 * Edit buyer profile form
 */
import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileAPI.get();
      const user = res.data.data;
      setProfile(user);
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        currentPassword: '',
        newPassword: '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('bio', form.bio);

      if (form.currentPassword && form.newPassword) {
        formData.append('currentPassword', form.currentPassword);
        formData.append('newPassword', form.newPassword);
      }

      const avatarInput = document.getElementById('avatar-upload');
      if (avatarInput?.files?.[0]) {
        formData.append('avatar', avatarInput.files[0]);
      }

      const res = await profileAPI.update(formData);
      setProfile(res.data.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading profile...</p></div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information</p>
      </div>

      {message.text && <div className={`alert alert--${message.type}`}>{message.text}</div>}

      <div className="profile-layout">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} />
            ) : (
              <span className="profile-avatar__placeholder">
                {profile?.name?.charAt(0)?.toUpperCase() || 'B'}
              </span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="avatar-upload" className="btn btn--outline btn--sm">Change Avatar</label>
            <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} />
          </div>
          <p className="profile-avatar__info">
            <strong>{profile?.name}</strong><br />
            {profile?.email}<br />
            <span className="badge badge--info">{profile?.role}</span>
          </p>
        </div>

        <form className="profile-form card" onSubmit={handleSubmit}>
          <div className="card__header"><h3>Edit Profile</h3></div>
          <div className="card__body">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input type="text" id="address" name="address" value={form.address} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={3} />
            </div>

            <hr />

            <h4>Change Password</h4>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" name="currentPassword" value={form.currentPassword} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input type="password" id="newPassword" name="newPassword" value={form.newPassword} onChange={handleChange} minLength={6} />
            </div>
          </div>
          <div className="card__footer">
            <button type="submit" className="btn btn--primary" disabled={saving} id="btn-save-profile">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
