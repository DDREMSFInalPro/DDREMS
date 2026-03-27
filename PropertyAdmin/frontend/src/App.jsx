import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import PropertyManagementPage from "./pages/PropertyManagementPage";
import AgreementManagementPage from "./pages/AgreementManagementPage";
import AgreementDetailPage from "./pages/AgreementDetailPage";
import PaymentsPage from "./pages/PaymentsPage";
import ProfilePage from "./pages/ProfilePage";
import FormalAgreementsPage from "./pages/FormalAgreementsPage";
import FormalAgreementDetailPage from "./pages/FormalAgreementDetailPage";

const App = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
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
        <Route path="profile" element={<ProfilePage />} />
        <Route path="formal-agreements" element={<FormalAgreementsPage />} />
        <Route
          path="formal-agreements/:id"
          element={<FormalAgreementDetailPage />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
