// frontend/src/App.jsx

import { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// --- LAYOUTS ---
import AppLayout from './components/AppLayout.jsx';
import Navbar from './components/Navbar.jsx';

// --- PAGE IMPORTS ---
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import QuickScanPage from './pages/QuickScanPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import PrintingDashboard from './pages/PrintingDashboard.jsx';
import LogisticsDashboard from './pages/LogisticsDashboard.jsx';
import SkincareDashboard from './pages/SkincareDashboard.jsx';
import PharmacyDashboardPage from './pages/PharmacyDashboardPage.jsx';
import HealthAdvisorDashboardPage from './pages/HealthAdvisorDashboardPage.jsx';
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage.jsx';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage.jsx';
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';
import AdminHistoryPage from './pages/AdminHistoryPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';
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
import ManufacturerAssignPage from './pages/ManufacturerAssignPage.jsx';
import PharmacyStockPage from './pages/PharmacyStockPage.jsx';
import PharmacyHistoryPage from './pages/PharmacyHistoryPage.jsx';
import CreateHealthVideoPage from './pages/CreateHealthVideoPage.jsx';
import ScanHistoryPage from './pages/ScanHistoryPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import AdminReportManagementPage from './pages/AdminReportManagementPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx'; // Import SettingsPage
import AdminCounterfeitContentPage from './pages/AdminCounterfeitContentPage.jsx'; // Import new page
import DvaReportsPage from './pages/DvaReportsPage.jsx'; // Import DvaReportsPage

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
      HEALTH_ADVISOR: '/health-advisor/dashboard/pending',
      CUSTOMER: '/scan',
    };
    return paths[role] || '/login';
  };

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{ /* ...toast options... */ }}
      />
      <Routes>
        {isAuthenticated ? (
          <Route path="/" element={<AppLayout />}>
            {/* --- The /scan route now correctly renders QuickScanPage inside the layout --- */} 
            <Route path="/scan" element={<QuickScanPage />} />
            <Route path="/history" element={<ScanHistoryPage />} />
            <Route path="/report" element={<ReportPage />} />

            {/* All Portal dashboards and pages */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
            {/* ... other portal routes ... */}
            <Route path="/dva/dashboard" element={<DvaDashboard />} />
            <Route path="/printing/dashboard" element={<PrintingDashboard />} />
            <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
            <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
            <Route path="/pharmacy/dashboard" element={<PharmacyDashboardPage />} />
            <Route path="/health-advisor/dashboard/:tab" element={<HealthAdvisorDashboardPage />} />
            <Route path="/admin/approval-queue" element={<AdminApprovalQueuePage />} />
            <Route path="/admin/registrations" element={<AdminRegistrationQueuePage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/history" element={<AdminHistoryPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/admin/map" element={<AdminMapPage />} />
            <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />
            <Route path="/admin/reports" element={<AdminReportManagementPage />} />
            <Route path="/admin/counterfeit-content" element={<AdminCounterfeitContentPage />} /> {/* New Route */}
            <Route path="/manufacturer/request-batch" element={<ManufacturerRequestBatchPage />} />
            <Route path="/manufacturer/batch-history" element={<ManufacturerBatchHistoryPage />} />
            <Route path="/manufacturer/assign-carton" element={<ManufacturerAssignPage />} />
            <Route path="/dva/approval-queue" element={<DvaApprovalQueuePage />} />
            <Route path="/dva/history" element={<DvaHistoryPage />} />
            <Route path="/dva/reports" element={<DvaReportsPage />} /> {/* New DVA Reports Page */}
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
            <Route path="/settings" element={<SettingsPage />} /> {/* New Settings Page Route */}
            
            {/* The root now redirects to the correct dashboard */}
            <Route index element={<Navigate to={getDashboardPath(user?.role)} replace />} />
            <Route path="*" element={<Navigate to={getDashboardPath(user?.role)} replace />} />
          </Route>
        ) : (
          <>
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