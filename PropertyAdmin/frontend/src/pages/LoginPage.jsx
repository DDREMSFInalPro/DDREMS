import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__icon">⚙️</span>
          <h1>DDREMS</h1>
          <p>Admin Portal</p>
        </div>
        <h2>Administrator Login</h2>
        <p className="login-card__subtitle">Sign in with admin credentials</p>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="admin@ddrems.com" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Enter password" />
          </div>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading} id="btn-login">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
