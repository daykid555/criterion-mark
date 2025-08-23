// frontend/src/App.jsx
import { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Layouts and Public Pages
import AppLayout from './components/AppLayout.jsx';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

// Role Dashboards (now Stats Pages)
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import PrintingDashboard from './pages/PrintingDashboard.jsx';
import LogisticsDashboard from './pages/LogisticsDashboard.jsx';
import SkincareDashboard from './pages/SkincareDashboard.jsx';

// Existing Pages
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import PrintingBatchPage from './pages/PrintingBatchPage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';

// --- IMPORT THE NEW ADMIN PAGE COMPONENTS ---
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage.jsx';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage.jsx';
import AdminHistoryPage from './pages/AdminHistoryPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useContext(AuthContext);
    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

const PublicLayout = () => ( <div className="min-h-screen w-full relative"> <Navbar /> <main><Outlet /></main> </div> );

function App() {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('admin-bg', location.pathname.startsWith('/admin'));
    return () => document.body.classList.remove('admin-bg');
  }, [location]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify" element={<VerificationPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Dashboards */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
        <Route path="/dva/dashboard" element={<DvaDashboard />} />
        <Route path="/printing/dashboard" element={<PrintingDashboard />} />
        <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
        <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
        
        {/* --- ADD THE NEW ADMIN ROUTES HERE --- */}
        <Route path="/admin/approval-queue" element={<AdminApprovalQueuePage />} />
        <Route path="/admin/registrations" element={<AdminRegistrationQueuePage />} />
        <Route path="/admin/users" element={<AdminUserManagementPage />} />
        <Route path="/admin/history" element={<AdminHistoryPage />} />
        <Route path="/admin/settings" element={<SystemSettingsPage />} />

        {/* Other existing routes */}
        <Route path="/admin/map" element={<AdminMapPage />} />
        <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />
        <Route path="/printing/batch/:id" element={<PrintingBatchPage />} />
      </Route>
    </Routes>
  );
}

export default App;