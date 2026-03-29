/**
 * App Component - Main routing configuration
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import PropertyListPage from "./pages/PropertyListPage";
import PropertyFormPage from "./pages/PropertyFormPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PaymentsPage from "./pages/PaymentsPage";
import AgreementListPage from "./pages/AgreementListPage";
import AgreementDetailPage from "./pages/AgreementDetailPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      {/* Public route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected owner routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="owner">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="properties" element={<PropertyListPage />} />
        <Route path="properties/new" element={<PropertyFormPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/edit/:id" element={<PropertyFormPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="agreements" element={<AgreementListPage />} />
        <Route path="agreements/:id" element={<AgreementDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="wallet" element={<WalletPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
};

export default App;
