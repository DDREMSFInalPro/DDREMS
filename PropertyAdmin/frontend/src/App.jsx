import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import PropertyManagementPage from "./pages/PropertyManagementPage";
import AgreementManagementPage from "./pages/AgreementManagementPage";
import AgreementDetailPage from "./pages/AgreementDetailPage";
import PaymentsPage from "./pages/PaymentsPage";
import ProfilePage from "./pages/ProfilePage";
import CommissionPage from "./pages/CommissionPage";

const App = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="properties" element={<PropertyManagementPage />} />
        <Route path="agreements" element={<AgreementManagementPage />} />
        <Route path="agreements/:id" element={<AgreementDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="commission" element={<CommissionPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  );
};

export default App;
