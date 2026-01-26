import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingFlow from './pages/OnboardingFlow';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import PatientDashboard from './pages/PatientDashboard';
import { preventBackNavigation, logout, getUser } from './utils/auth';
import './App.css';


// Dashboard Router - Routes to correct dashboard based on role
const DashboardRouter = () => {
  const user = getUser();
  const navigate = useNavigate(); // Added useNavigate for potential logout redirect

  console.log('[DashboardRouter] User role:', user?.role, 'status:', user?.status);

  useEffect(() => {
    // Prevent back navigation
    preventBackNavigation();
  }, []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'caregiver':
      return <CaregiverDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      // If role is not recognized or user somehow gets here without a valid role
      // It's good practice to log them out or redirect to login
      logout();
      return <Navigate to="/login" />;
  }
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireActive = true }) => {
  const user = getUser();
  const isAuth = user && localStorage.getItem('access_token');

  console.log('[ProtectedRoute] path:', window.location.pathname, 'user status:', user?.status, 'isAuth:', !!isAuth);

  if (!isAuth) {
    console.log('[ProtectedRoute] No auth, redirecting to /login');
    return <Navigate to="/login" />;
  }

  if (requireActive && user.status === 'pending') {
    console.log('[ProtectedRoute] User is pending, redirecting to /onboarding');
    return <Navigate to="/onboarding" />;
  }

  console.log('[ProtectedRoute] Access granted');

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireActive={false}>
                <OnboardingFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
