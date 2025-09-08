// frontend/src/App.jsx

import { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// --- LAYOUTS ---
import AppLayout from './components/AppLayout.jsx';
import Navbar from './components/Navbar.jsx';

// --- PAGE IMPORTS (imports are the same, no changes needed here) ---
import HomePage from './pages/HomePage.jsx';
//... (all other imports)
import HealthAdvisorDashboardPage from './pages/HealthAdvisorDashboardPage.jsx';
import CreateHealthVideoPage from './pages/CreateHealthVideoPage.jsx';
import PharmacyHistoryPage from './pages/PharmacyHistoryPage.jsx';
import PharmacyStockPage from './pages/PharmacyStockPage.jsx';
import LogisticsHistoryPage from './pages/LogisticsHistoryPage.jsx';
import LogisticsActiveShipmentsPage from './pages/LogisticsActiveShipmentsPage.jsx';
import PrintingBatchPage from './pages/PrintingBatchPage.jsx';
import PrintingHistoryPage from './pages/PrintingHistoryPage.jsx';
import PrintingQueuePage from './pages/PrintingQueuePage.jsx';
import SkincareHistoryPage from './pages/SkincareHistoryPage.jsx';
import SkincareAddProductPage from './pages/SkincareAddProductPage.jsx';
import DvaHistoryPage from './pages/DvaHistoryPage.jsx';
import DvaApprovalQueuePage from './pages/DvaApprovalQueuePage.jsx';
import ManufacturerAssignPage from './pages/ManufacturerAssignPage.jsx';
import ManufacturerBatchHistoryPage from './pages/ManufacturerBatchHistoryPage.jsx';
import ManufacturerRequestBatchPage from './pages/ManufacturerRequestBatchPage.jsx';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
import AdminHistoryPage from './pages/AdminHistoryPage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage.jsx';
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage.jsx';
import PharmacyDashboardPage from './pages/PharmacyDashboardPage.jsx';
import SkincareDashboard from './pages/SkincareDashboard.jsx';
import LogisticsDashboard from './pages/LogisticsDashboard.jsx';
import PrintingDashboard from './pages/PrintingDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import QuickScanPage from './pages/QuickScanPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import LoginPage from './pages/LoginPage.jsx';


// --- ROUTING LOGIC ---
const PublicLayout = () => ( <> <Navbar /> <main> <Outlet /> </main> </> );

function App() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();
  const isPwa = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    document.body.classList.toggle('admin-bg', isAuthenticated && location.pathname.startsWith('/admin'));
  }, [location, isAuthenticated]);

  if (isLoading) return null;

  const getDashboardPath = (role) => {
    const paths = {
      ADMIN: '/admin/dashboard',
      MANUFACTURER: '/manufacturer/dashboard',
      DVA: '/dva/dashboard',
      PRINTING: '/printing/dashboard',
      LOGISTICS: '/logistics/dashboard',
      SKINCARE_BRAND: '/skincare/dashboard',
      PHARMACY: '/pharmacy/dashboard',
      // --- UPDATED: The default path for Health Advisor is now the "pending" view ---
      HEALTH_ADVISOR: '/health-advisor/dashboard/pending',
    };
    return paths[role] || '/login';
  };

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 6000,
          style: {
            background: 'rgba(26, 42, 69, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '20px',
            minWidth: '320px',
            borderRadius: '12px',
            fontSize: '1.1rem',
            textAlign: 'center',
          },
        }}
      />
      <Routes>
        {isAuthenticated ? (
          <Route path="/" element={<AppLayout />}>
            {/* Role Dashboards */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
            <Route path="/dva/dashboard" element={<DvaDashboard />} />
            <Route path="/printing/dashboard" element={<PrintingDashboard />} />
            <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
            <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
            <Route path="/pharmacy/dashboard" element={<PharmacyDashboardPage />} />
            
            {/* --- UPDATED: Health Advisor routes are now more specific --- */}
            <Route path="/health-advisor/dashboard/:tab" element={<HealthAdvisorDashboardPage />} />

            {/* Admin Pages */}
            <Route path="/admin/approval-queue" element={<AdminApprovalQueuePage />} />
            {/* ... other admin routes */}
            <Route path="/admin/registrations" element={<AdminRegistrationQueuePage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/history" element={<AdminHistoryPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/admin/map" element={<AdminMapPage />} />
            <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />

            {/* Other Portal Pages */}
            <Route path="/manufacturer/request-batch" element={<ManufacturerRequestBatchPage />} />
            {/* ... other portal routes */}
            <Route path="/manufacturer/batch-history" element={<ManufacturerBatchHistoryPage />} />
            <Route path="/manufacturer/assign-carton" element={<ManufacturerAssignPage />} />
            <Route path="/dva/approval-queue" element={<DvaApprovalQueuePage />} />
            <Route path="/dva/history" element={<DvaHistoryPage />} />
            <Route path="/skincare/add-product" element={<SkincareAddProductPage />} />
            <Route path="/skincare/history" element={<SkincareHistoryPage />} />
            <Route path="/printing/queue" element={<PrintingQueuePage />} />
            <Route path="/printing/history" element={<PrintingHistoryPage />} />
            <Route path="/printing/batch/:id" element={<PrintingBatchPage />} />
            <Route path="/logistics/active" element={<LogisticsActiveShipmentsPage />} />
            <Route path="/logistics/history" element={<LogisticsHistoryPage />} />
            <Route path="/pharmacy/stock" element={<PharmacyStockPage />} />
            <Route path="/pharmacy/history" element={<PharmacyHistoryPage />} />
            
            <Route path="/health-advisor/create" element={<CreateHealthVideoPage />} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to={getDashboardPath(user.role)} replace />} />
          </Route>
        ) : (
          <>
             {/* Public routes remain the same */}
            <Route path="/" element={isPwa ? <QuickScanPage /> : <HomePage />} />
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/verify" element={<VerificationPage />} />
            </Route>
            <Route path="*" element={<Navigate to={isPwa ? '/' : '/login'} replace />} />
          </>
        )}
      </Routes>
    </>
  );
}

export default App;