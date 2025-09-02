import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';

// Import All Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import QuickScanPage from './pages/QuickScanPage';
import VerificationPage from './pages/VerificationPage'; // From your file list

// Import All Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminApprovalQueuePage from './pages/AdminApprovalQueuePage';
import AdminRegistrationQueuePage from './pages/AdminRegistrationQueuePage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminMapPage from './pages/AdminMapPage';
import AdminHistoryPage from './pages/AdminHistoryPage';
import AdminSystemSettingsPage from './pages/SystemSettingsPage';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage';

// Import All Manufacturer Pages
import ManufacturerDashboardPage from './pages/ManufacturerDashboardPage';
import ManufacturerRequestBatchPage from './pages/ManufacturerRequestBatchPage';
import ManufacturerBatchHistoryPage from './pages/ManufacturerBatchHistoryPage';
import ManufacturerAssignPage from './pages/ManufacturerAssignPage';

// Import All Pharmacy Pages
import PharmacyDashboardPage from './pages/PharmacyDashboardPage';
import PharmacyStockPage from './pages/PharmacyStockPage';
import PharmacyHistoryPage from './pages/PharmacyHistoryPage';

// Import All DVA Pages
import DvaDashboardPage from './pages/DvaDashboardPage';
import DvaApprovalQueuePage from './pages/DvaApprovalQueuePage';
import DvaHistoryPage from './pages/DvaHistoryPage';

// Import All Printing Pages
import PrintingDashboardPage from './pages/PrintingDashboardPage';
import PrintingQueuePage from './pages/PrintingQueuePage';
import PrintingHistoryPage from './pages/PrintingHistoryPage';

// Import All Logistics Pages
import LogisticsDashboardPage from './pages/LogisticsDashboardPage';
import LogisticsActiveShipmentsPage from './pages/LogisticsActiveShipmentsPage';
import LogisticsHistoryPage from './pages/LogisticsHistoryPage';

// Import All Skincare Pages
import SkincareDashboard from './pages/SkincareDashboard';
import SkincareAddProductPage from './pages/SkincareAddProductPage'; // From your file list
import SkincareHistoryPage from './pages/SkincareHistoryPage'; // From your file list

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify/:code" element={<PublicVerifyPage />} />
        <Route path="/scan-only" element={<QuickScanPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        
        {/* Protected Routes inside AppLayout */}
        <Route element={<AppLayout />}>
          {/* Admin */}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/approval-queue" element={<AdminApprovalQueuePage />} />
          <Route path="/admin/registrations" element={<AdminRegistrationQueuePage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/map" element={<AdminMapPage />} />
          <Route path="/admin/history" element={<AdminHistoryPage />} />
          <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
          <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />
          
          {/* Manufacturer */}
          <Route path="/manufacturer/dashboard" element={<ManufacturerDashboardPage />} />
          <Route path="/manufacturer/request-batch" element={<ManufacturerRequestBatchPage />} />
          <Route path="/manufacturer/batch-history" element={<ManufacturerBatchHistoryPage />} />
          <Route path="/manufacturer/assign-carton" element={<ManufacturerAssignPage />} />
          
          {/* Pharmacy */}
          <Route path="/pharmacy/dashboard" element={<PharmacyDashboardPage />} />
          <Route path="/pharmacy/stock" element={<PharmacyStockPage />} />
          <Route path="/pharmacy/history" element={<PharmacyHistoryPage />} />
          
          {/* DVA */}
          <Route path="/dva/dashboard" element={<DvaDashboardPage />} />
          <Route path="/dva/approval-queue" element={<DvaApprovalQueuePage />} />
          <Route path="/dva/history" element={<DvaHistoryPage />} />
          
          {/* Printing */}
          <Route path="/printing/dashboard" element={<PrintingDashboardPage />} />
          <Route path="/printing/queue" element={<PrintingQueuePage />} />
          <Route path="/printing/history" element={<PrintingHistoryPage />} />
          
          {/* Logistics */}
          <Route path="/logistics/dashboard" element={<LogisticsDashboardPage />} />
          <Route path="/logistics/active" element={<LogisticsActiveShipmentsPage />} />
          <Route path="/logistics/history" element={<LogisticsHistoryPage />} />

          {/* Skincare */}
          <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
          <Route path="/skincare/add-product" element={<SkincareAddProductPage />} />
          <Route path="/skincare/history" element={<SkincareHistoryPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;