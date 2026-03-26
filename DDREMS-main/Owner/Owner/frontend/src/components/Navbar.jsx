/**
 * Navbar Component
 * Top navigation bar with hamburger menu and user info
 */
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button
          className="navbar__hamburger"
          onClick={onToggleSidebar}
          id="btn-toggle-sidebar"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="navbar__title">Owner Portal</h1>
      </div>
      <div className="navbar__right">
        <span className="navbar__greeting">
          Welcome, <strong>{user?.name || 'Owner'}</strong>
        </span>
        <div className="navbar__avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="navbar__avatar-img" />
          ) : (
            <span className="navbar__avatar-placeholder">
              {user?.name?.charAt(0)?.toUpperCase() || 'O'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
