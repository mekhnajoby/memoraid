import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingFlow from './pages/OnboardingFlow';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminApprovals from './pages/AdminApprovals';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminPatientRegistry from './pages/AdminPatientRegistry';
import AdminAlerts from './pages/AdminAlerts';
import AdminInquiries from './pages/AdminInquiries';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import PatientLinking from './pages/caregiver/PatientLinking';
import MyPatients from './pages/caregiver/MyPatients';
import GlobalAlerts from './pages/caregiver/GlobalAlerts';
import InquiriesModule from './pages/caregiver/InquiriesModule';
import AccountSettings from './pages/caregiver/AccountSettings';
import PatientWorkspace from './pages/caregiver/PatientWorkspace';
import PatientDashboard from './pages/PatientDashboard';
import PatientRoutines from './pages/PatientRoutines';
import useNotifications from './hooks/useNotifications';
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
      return <Navigate to="/admin-dashboard" replace />;
    case 'caregiver':
      return <Navigate to="/caregiver-dashboard" replace />;
    case 'patient':
      return <Navigate to="/patient-dashboard" replace />;
    default:
      logout();
      return <Navigate to="/login" replace />;
  }
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireActive = true, allowedRoles }) => {
  const user = getUser();
  const isAuth = user && localStorage.getItem('access_token');

  // Register for push notifications when authorized
  useNotifications(user);

  console.log('[ProtectedRoute] path:', window.location.pathname, 'user role:', user?.role, 'isAuth:', !!isAuth);

  if (!isAuth) {
    console.log('[ProtectedRoute] No auth, redirecting to /login');
    return <Navigate to="/login" />;
  }

  if (requireActive && user.status === 'pending') {
    console.log('[ProtectedRoute] User is pending, redirecting to /onboarding');
    return <Navigate to="/onboarding" />;
  }

  // Role-based access control: redirect to correct dashboard if role doesn't match
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`[ProtectedRoute] Role "${user.role}" not in allowed roles [${allowedRoles}], redirecting to /dashboard`);
    return <Navigate to="/dashboard" replace />;
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
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin']}><AdminApprovals /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUserManagement /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><AdminPatientRegistry /></ProtectedRoute>} />
          <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['admin']}><AdminAlerts /></ProtectedRoute>} />
          <Route path="/admin/inquiries" element={<ProtectedRoute allowedRoles={['admin']}><AdminInquiries /></ProtectedRoute>} />

          {/* Caregiver Routes */}
          <Route path="/caregiver-dashboard" element={<ProtectedRoute allowedRoles={['caregiver']}><CaregiverDashboard /></ProtectedRoute>} />
          <Route path="/caregiver" element={<Navigate to="/caregiver-dashboard" replace />} />
          <Route path="/caregiver/link-patient" element={<ProtectedRoute allowedRoles={['caregiver']}><PatientLinking /></ProtectedRoute>} />
          <Route path="/caregiver/my-patients" element={<ProtectedRoute allowedRoles={['caregiver']}><MyPatients /></ProtectedRoute>} />
          <Route path="/caregiver/alerts" element={<ProtectedRoute allowedRoles={['caregiver']}><GlobalAlerts /></ProtectedRoute>} />
          <Route path="/caregiver/workspace/:patientId/*" element={<ProtectedRoute allowedRoles={['caregiver']}><PatientWorkspace /></ProtectedRoute>} />
          <Route path="/caregiver/inquiries" element={<ProtectedRoute allowedRoles={['caregiver']}><InquiriesModule /></ProtectedRoute>} />
          <Route path="/caregiver/settings" element={<ProtectedRoute allowedRoles={['caregiver']}><AccountSettings /></ProtectedRoute>} />
          <Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/routines" element={<ProtectedRoute allowedRoles={['patient']}><PatientRoutines /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
