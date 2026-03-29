import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <nav className="landing__nav">
        <div className="landing__nav-brand">
          <span className="landing__nav-icon">🏠</span>
          <span>DireDawa Real Estate Management System</span>
        </div>
        <div className="landing__nav-links">
          <a href="#hero">Home</a>
          <a href="#features">Properties</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="landing__nav-actions">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>Login</button>
        </div>
      </nav>

      <section className="landing__hero" id="hero">
        <div className="landing__hero-overlay" />

        <div className="landing__hero-left">
          <h1>Manage Your Properties<br />in Dire Dawa</h1>
          <p>List, Track, and Manage Your Real Estate Portfolio Easily</p>
          <div className="landing__features-list">
            <div className="landing__feature-item">🏢 List & manage your properties</div>
            <div className="landing__feature-item">📄 Handle agreement requests</div>
            <div className="landing__feature-item">💰 Track payments & revenue</div>
            <div className="landing__feature-item">📊 View analytics & insights</div>
          </div>
        </div>

        <div className="landing__login-card">
          <h2>Owner Login</h2>
          {error && <div className="landing__error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="landing__input-group">
              <span>✉️</span>
              <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="landing__input-group">
              <span>🔒</span>
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="landing__login-meta">
              <label><input type="checkbox" /> Remember Me</label>
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className="landing__register-link">
            Don't have an account? <a onClick={() => navigate("/login")}>Contact Admin</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
