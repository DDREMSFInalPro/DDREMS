import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState({ location: "", type: "", price: "" });

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
      {/* Navbar */}
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
          <button className="btn-nav-register" onClick={() => navigate("/register")}>Register</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero" id="hero">
        <div className="landing__hero-overlay" />

        {/* Left: Hero text + search */}
        <div className="landing__hero-left">
          <h1>Find Your Dream Property<br />in Dire Dawa</h1>
          <p>Buy, Rent, or Manage Properties Easily</p>
          <div className="landing__search-bar">
            <div className="landing__search-field">
              <span>📍</span>
              <input
                type="text"
                placeholder="Enter a city, neighborhood, or address..."
                value={search.location}
                onChange={(e) => setSearch({ ...search, location: e.target.value })}
              />
            </div>
            <div className="landing__search-field">
              <span>🏠</span>
              <select value={search.type} onChange={(e) => setSearch({ ...search, type: e.target.value })}>
                <option value="">Property Type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div className="landing__search-field">
              <span>💲</span>
              <input
                type="number"
                placeholder="Max Price"
                value={search.price}
                onChange={(e) => setSearch({ ...search, price: e.target.value })}
              />
            </div>
            <button className="btn-search" onClick={() => navigate("/browse")}>Search Properties</button>
          </div>
        </div>

        {/* Right: Login form */}
        <div className="landing__login-card">
          <h2>Login</h2>
          {error && <div className="landing__error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="landing__input-group">
              <span>✉️</span>
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="landing__input-group">
              <span>🔒</span>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
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
            Don't have an account? <a onClick={() => navigate("/register")}>Create an account</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
