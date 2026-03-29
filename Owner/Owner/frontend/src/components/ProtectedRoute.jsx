/**
 * Protected Route Component
 * Redirects unauthenticated users to login
 * Optionally checks for specific roles
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Required role: <strong>{requiredRole}</strong></p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
