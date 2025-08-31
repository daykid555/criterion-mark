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
// --- Validator Dashboard Import ---
import ValidatorDashboard from './pages/ValidatorDashboard.jsx'; // Make sure this is imported

// Admin Pages
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage.jsx';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';
import AdminHistoryPage from './pages/AdminHistoryPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';

// --- IMPORTING ALL OTHER PORTAL PAGES ---
import ManufacturerRequestBatchPage from './pages/ManufacturerRequestBatchPage.jsx';
import ManufacturerBatchHistoryPage from './pages/ManufacturerBatchHistoryPage.jsx';
import DvaApprovalQueuePage from './pages/DvaApprovalQueuePage.jsx';
import DvaHistoryPage from './pages/DvaHistoryPage.jsx';
import SkincareAddProductPage from './pages/SkincareAddProductPage.jsx';
import SkincareHistoryPage from './pages/SkincareHistoryPage.jsx';
import PrintingQueuePage from './pages/PrintingQueuePage.jsx';
import PrintingHistoryPage from './pages/PrintingHistoryPage.jsx';
import PrintingBatchPage from './pages/PrintingBatchPage.jsx';
import LogisticsActiveShipmentsPage from './pages/LogisticsActiveShipmentsPage.jsx';
import LogisticsHistoryPage from './pages/LogisticsHistoryPage.jsx';


// --- ROUTING LOGIC ---
const PublicLayout = () => ( <> <Navbar /> <main> <Outlet /> </main> </> );

function App() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('admin-bg', isAuthenticated && location.pathname.startsWith('/admin'));
  }, [location, isAuthenticated]);

  if (isLoading) {
    return null; // Or a loading spinner component
  }

  const getDashboardPath = (role) => {
    const paths = {
      ADMIN: '/admin/dashboard',
      MANUFACTURER: '/manufacturer/dashboard',
      DVA: '/dva/dashboard',
      PRINTING: '/printing/dashboard',
      LOGISTICS: '/logistics/dashboard',
      SKINCARE_BRAND: '/skincare/dashboard',
      VALIDATOR: '/validator/dashboard', // FIX: Added Validator dashboard path
    };
    return paths[role] || '/login'; // Fallback to login if role is unrecognized
  };

  return (
    <Routes>
      {isAuthenticated ? (
        // --- ALL PROTECTED ROUTES ---
        <Route path="/" element={<AppLayout />}>
          {/* Dashboards */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
          <Route path="/dva/dashboard" element={<DvaDashboard />} />
          <Route path="/printing/dashboard" element={<PrintingDashboard />} />
          <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
          <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
          <Route path="/validator/dashboard" element={<ValidatorDashboard />} /> {/* FIX: Added Validator Dashboard route */}
          
          {/* Admin Routes */}
          <Route path="/admin/approval-queue" element={<AdminApprovalQueuePage />} />
          <Route path="/admin/registrations" element={<AdminRegistrationQueuePage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/history" element={<AdminHistoryPage />} />
          <Route path="/admin/settings" element={<SystemSettingsPage />} />
          <Route path="/admin/map" element={<AdminMapPage />} />
          <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />

          {/* Manufacturer Routes */}
          <Route path="/manufacturer/request-batch" element={<ManufacturerRequestBatchPage />} />
          <Route path="/manufacturer/batch-history" element={<ManufacturerBatchHistoryPage />} />

          {/* DVA Routes */}
          <Route path="/dva/approval-queue" element={<DvaApprovalQueuePage />} />
          <Route path="/dva/history" element={<DvaHistoryPage />} />
          
          {/* Skincare Routes */}
          <Route path="/skincare/add-product" element={<SkincareAddProductPage />} />
          <Route path="/skincare/history" element={<SkincareHistoryPage />} />

          {/* Printing Routes */}
          <Route path="/printing/queue" element={<PrintingQueuePage />} />
          <Route path="/printing/history" element={<PrintingHistoryPage />} />
          <Route path="/printing/batch/:id" element={<PrintingBatchPage />} />

          {/* Logistics Routes */}
          <Route path="/logistics/active" element={<LogisticsActiveShipmentsPage />} />
          <Route path="/logistics/history" element={<LogisticsHistoryPage />} />
          
          {/* Redirect any other path to the user's correct dashboard */}
          <Route path="*" element={<Navigate to={getDashboardPath(user.role)} replace />} />
        </Route>
      ) : (
        // --- ALL PUBLIC ROUTES ---
        <>
          <Route path="/" element={<HomePage />} />
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/verify" element={<VerificationPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;