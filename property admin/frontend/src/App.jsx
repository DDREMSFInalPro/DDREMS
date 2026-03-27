import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from './components/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { hydrateUser } from './store/slices/authSlice.js';
import { connectSocket, disconnectSocket } from './store/slices/socketSlice.js';

// Lazy-loaded route components
const Dashboard        = lazy(() => import('./pages/Dashboard.jsx'));
const Verification     = lazy(() => import('./pages/Verification.jsx'));
const PropertyReview   = lazy(() => import('./pages/PropertyReview.jsx'));
const DocumentInbox    = lazy(() => import('./pages/DocumentInbox.jsx'));
const RegisterProperty = lazy(() => import('./pages/RegisterProperty.jsx'));
const Messages         = lazy(() => import('./pages/Messages.jsx'));
const PropertyOwners   = lazy(() => import('./pages/PropertyOwners.jsx'));
const Buyers           = lazy(() => import('./pages/Buyers.jsx'));
const Renters          = lazy(() => import('./pages/Renters.jsx'));
const Reports          = lazy(() => import('./pages/Reports.jsx'));
const PriceRecommendations = lazy(() => import('./pages/PriceRecommendations.jsx'));
const FraudAlerts      = lazy(() => import('./pages/FraudAlerts.jsx'));
const BrokerManagement = lazy(() => import('./pages/BrokerManagement.jsx'));
const ComplianceMonitoring = lazy(() => import('./pages/ComplianceMonitoring.jsx'));
const Requests         = lazy(() => import('./pages/Requests.jsx'));
const PublicRequestForm = lazy(() => import('./pages/PublicRequestForm.jsx'));
const Agreements       = lazy(() => import('./pages/Agreements.jsx'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <CircularProgress />
  </Box>
);

const ProtectedRoute = ({ children }) => {
  const { token, isHydrating } = useSelector((state) => state.auth);

  if (isHydrating) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return token
    ? <MainLayout><Suspense fallback={<PageLoader />}>{children}</Suspense></MainLayout>
    : <Navigate to="/login" replace />;
};

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  // Hydrate user data on page refresh when token exists but user is null
  useEffect(() => {
    if (token && !user) {
      dispatch(hydrateUser());
    }
  }, [dispatch, token, user]);

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (token) {
      dispatch(connectSocket());
    } else {
      dispatch(disconnectSocket());
    }
  }, [dispatch, token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/request" element={<Suspense fallback={<PageLoader />}><PublicRequestForm /></Suspense>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
      <Route path="/verification/:id" element={<ProtectedRoute><PropertyReview /></ProtectedRoute>} />
      <Route path="/register-property" element={<ProtectedRoute><RegisterProperty /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentInbox /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/owners" element={<ProtectedRoute><PropertyOwners /></ProtectedRoute>} />
      <Route path="/buyers" element={<ProtectedRoute><Buyers /></ProtectedRoute>} />
      <Route path="/renters" element={<ProtectedRoute><Renters /></ProtectedRoute>} />
      <Route path="/agreements" element={<ProtectedRoute><Agreements /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/price-recommendations" element={<ProtectedRoute><PriceRecommendations /></ProtectedRoute>} />
      <Route path="/fraud-alerts" element={<ProtectedRoute><FraudAlerts /></ProtectedRoute>} />
      <Route path="/brokers" element={<ProtectedRoute><BrokerManagement /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><ComplianceMonitoring /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
