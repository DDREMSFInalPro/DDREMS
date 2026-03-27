import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__hamburger" onClick={onToggleSidebar} id="btn-toggle-sidebar" aria-label="Toggle sidebar">☰</button>
        <h1 className="navbar__title">Admin Portal</h1>
      </div>
      <div className="navbar__right">
        <span className="navbar__greeting">Welcome, <strong>{user?.name || 'Admin'}</strong></span>
        <div className="navbar__avatar">
          <span className="navbar__avatar-placeholder">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
