// frontend/src/App.jsx
import { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// --- LAYOUTS ---
import AppLayout from './components/AppLayout.jsx';
import Navbar from './components/Navbar.jsx';

// --- PAGE IMPORTS ---
// Public Pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

// Role Dashboards
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import PrintingDashboard from './pages/PrintingDashboard.jsx';
import LogisticsDashboard from './pages/LogisticsDashboard.jsx';
import SkincareDashboard from './pages/SkincareDashboard.jsx';

// Admin Pages
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage.jsx';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';
import AdminHistoryPage from './pages/AdminHistoryPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';

// Other Pages
import PrintingBatchPage from './pages/PrintingBatchPage.jsx';

// This is a new, simplified Public Layout wrapper
const PublicLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
  </>
);

function App() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    // This logic MUST remain to handle the admin background theme
    document.body.classList.toggle('admin-bg', isAuthenticated && location.pathname.startsWith('/admin'));
  }, [location, isAuthenticated]);

  // While the auth context is loading, render nothing to prevent flashes of incorrect content
  if (isLoading) {
    return null; 
  }

  // Helper to redirect logged-in users away from the login page
  const getDashboardPath = (role) => {
    const paths = {
      ADMIN: '/admin/dashboard',
      MANUFACTURER: '/manufacturer/dashboard',
      DVA: '/dva/dashboard',
      PRINTING: '/printing/dashboard',
      LOGISTICS: '/logistics/dashboard',
      SKINCARE_BRAND: '/skincare/dashboard',
    };
    return paths[role] || '/login';
  };

  return (
    <Routes>
      {isAuthenticated ? (
        // --- ALL PROTECTED ROUTES ---
        // If the user is authenticated, these are the only possible routes.
        <Route path="/" element={<AppLayout />}>
          {/* Dashboards */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
          <Route path="/dva/dashboard" element={<DvaDashboard />} />
          <Route path="/printing/dashboard" element={<PrintingDashboard />} />
          <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
          <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin/approval-queue" element={<AdminApprovalQueuePage />} />
          <Route path="/admin/registrations" element={<AdminRegistrationQueuePage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/history" element={<AdminHistoryPage />} />
          <Route path="/admin/settings" element={<SystemSettingsPage />} />
          <Route path="/admin/map" element={<AdminMapPage />} />
          <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />

          {/* Other Routes */}
          <Route path="/printing/batch/:id" element={<PrintingBatchPage />} />
          
          {/* Redirect any other path to the user's correct dashboard */}
          <Route path="*" element={<Navigate to={getDashboardPath(user.role)} replace />} />
        </Route>
      ) : (
        // --- ALL PUBLIC ROUTES ---
        // If the user is NOT authenticated, these are the only possible routes.
        <>
          <Route path="/" element={<HomePage />} />
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/verify" element={<VerificationPage />} />
          </Route>
          {/* Any other path redirects to the login page */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;