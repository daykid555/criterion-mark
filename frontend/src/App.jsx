// frontend/src/App.jsx
import { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// --- Helper function to get the correct dashboard path based on user role ---
const getDashboardPath = (role) => {
  const paths = {
    ADMIN: '/admin/dashboard',
    MANUFACTURER: '/manufacturer/dashboard',
    DVA: '/dva/dashboard',
    PRINTING: '/printing/dashboard',
    LOGISTICS: '/logistics/dashboard',
    SKINCARE_BRAND: '/skincare/dashboard',
  };
  return paths[role] || '/login'; // Default to login if role is unknown
};


// --- Layouts and Route Guards ---

// AppLayout: The main layout for logged-in users (Sidebar + Content)
import AppLayout from './components/AppLayout.jsx';

// PublicLayout: The layout for public pages (Navbar + Content)
import Navbar from './components/Navbar.jsx';
const PublicLayout = () => (
  <div className="min-h-screen w-full relative">
    <Navbar />
    <main><Outlet /></main>
  </div>
);

// ProtectedRoute: Gatekeeper for authenticated pages
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  if (isLoading) return null; // Or a loading spinner
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />;
};

// PublicRoute: Prevents logged-in users from seeing login/register pages
const PublicRoute = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  if (isLoading) return null; // Or a loading spinner
  return isAuthenticated ? <Navigate to={getDashboardPath(user?.role)} replace /> : <PublicLayout />;
};


// --- Page Imports ---

// Public Pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

// Role Dashboards (Stats Pages)
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import PrintingDashboard from './pages/PrintingDashboard.jsx';
import LogisticsDashboard from './pages/LogisticsDashboard.jsx';
import SkincareDashboard from './pages/SkincareDashboard.jsx';

// All Other Pages
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import PrintingBatchPage from './pages/PrintingBatchPage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage.jsx';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage.jsx';
import AdminHistoryPage from './pages/AdminHistoryPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
// ... import all other page components you have created ...


// --- Main App Component ---

function App() {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('admin-bg', location.pathname.startsWith('/admin'));
    return () => document.body.classList.remove('admin-bg');
  }, [location]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
      </Route>
      
      {/* Standalone Public routes that don't need the redirect logic */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify" element={<VerificationPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
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
        
        {/* Other Routes (Manufacturer, DVA, etc.) would go here */}
        <Route path="/printing/batch/:id" element={<PrintingBatchPage />} />
      </Route>
    </Routes>
  );
}

export default App;