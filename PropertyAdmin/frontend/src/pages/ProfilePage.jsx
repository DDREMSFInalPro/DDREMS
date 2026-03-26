import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', phone: '', address: '', bio: '', currentPassword: '', newPassword: '' });

  useEffect(() => {
    profileAPI.get().then((res) => {
      const u = res.data.data;
      setProfile(u);
      setForm({ name: u.name || '', phone: u.phone || '', address: u.address || '', bio: u.bio || '', currentPassword: '', newPassword: '' });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('bio', form.bio);
      if (form.currentPassword && form.newPassword) { formData.append('currentPassword', form.currentPassword); formData.append('newPassword', form.newPassword); }
      const avatarInput = document.getElementById('avatar-upload');
      if (avatarInput?.files?.[0]) formData.append('avatar', avatarInput.files[0]);
      const res = await profileAPI.update(formData);
      setProfile(res.data.data);
      setMessage({ type: 'success', text: 'Profile updated!' });
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed.' }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="profile-page">
      <div className="page-header"><h1>My Profile</h1><p>Manage your admin profile</p></div>
      {message.text && <div className={`alert alert--${message.type}`}>{message.text}</div>}
      <div className="profile-layout">
        <div className="profile-avatar-section">
          <div className="profile-avatar">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span className="profile-avatar__placeholder">{profile?.name?.charAt(0)?.toUpperCase() || 'A'}</span>}</div>
          <div className="form-group"><label htmlFor="avatar-upload" className="btn btn--outline btn--sm">Change Avatar</label><input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }} /></div>
          <p className="profile-avatar__info"><strong>{profile?.name}</strong><br />{profile?.email}<br /><span className="badge badge--info">{profile?.role}</span></p>
        </div>
        <form className="profile-form card" onSubmit={handleSubmit}>
          <div className="card__header"><h3>Edit Profile</h3></div>
          <div className="card__body">
            <div className="form-group"><label>Full Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-group"><label>Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="form-group"><label>Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
            <hr /><h4>Change Password</h4>
            <div className="form-group"><label>Current Password</label><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></div>
            <div className="form-group"><label>New Password</label><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} minLength={6} /></div>
          </div>
          <div className="card__footer"><button type="submit" className="btn btn--primary" disabled={saving} id="btn-save-profile">{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
