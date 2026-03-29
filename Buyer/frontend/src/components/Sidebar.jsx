/**
 * Sidebar Component (Buyer Module)
 * Navigation sidebar for the buyer portal
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/browse', label: 'Browse Properties', icon: '🔍' },
    { path: '/saved', label: 'Saved Properties', icon: '❤️' },
    { path: '/ai-price', label: 'AI Price Advisor', icon: '🤖' },
    { path: '/agreements', label: 'My Agreements', icon: '📄' },
    { path: '/payments', label: 'Payments', icon: '💰' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <span className="sidebar__logo-icon">🏠</span>
            <div className="sidebar__logo-text">
              <h2>DDREMS</h2>
              <span>Buyer Portal</span>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || 'Buyer'}</span>
              <span className="sidebar__user-role">{user?.role || 'buyer'}</span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} id="btn-logout">
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
