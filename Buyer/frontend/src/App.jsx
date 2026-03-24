/**
 * App Component - Main routing configuration (Buyer Module)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BrowsePropertiesPage from './pages/BrowsePropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import AgreementRequestsPage from './pages/AgreementRequestsPage';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected buyer routes */}
      <Route element={<ProtectedRoute requiredRole="buyer"><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="browse" element={<BrowsePropertiesPage />} />
        <Route path="browse/:id" element={<PropertyDetailPage />} />
        <Route path="saved" element={<SavedPropertiesPage />} />
        <Route path="agreements" element={<AgreementRequestsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
