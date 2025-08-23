// frontend/src/App.jsx
import { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import AppLayout from './components/AppLayout.jsx';
import Navbar from './components/Navbar.jsx';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';
import AdminMapPage from './pages/AdminMapPage.jsx';
import PrintingDashboard from './pages/PrintingDashboard.jsx';
import PrintingBatchPage from './pages/PrintingBatchPage.jsx';
import LogisticsDashboard from './pages/LogisticsDashboard.jsx';
import SkincareDashboard from './pages/SkincareDashboard.jsx';

// --- IMPORT THE NEW PAGE ---
import AdminUserManagementPage from './pages/AdminUserManagementPage.jsx';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useContext(AuthContext);
    
    if (isLoading) {
        return null;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

const PublicLayout = () => ( <div className="min-h-screen w-full relative"> <Navbar /> <main><Outlet /></main> </div> );

function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.body.classList.add('admin-bg');
    } else {
      document.body.classList.remove('admin-bg');
    }
    
    return () => {
      document.body.classList.remove('admin-bg');
    };
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify" element={<VerificationPage />} />
      </Route>
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
        <Route path="/dva/dashboard" element={<DvaDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* --- ADD THE NEW ROUTE HERE --- */}
        <Route path="/admin/users" element={<AdminUserManagementPage />} />
        <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />
        <Route path="/admin/map" element={<AdminMapPage />} />
        <Route path="/printing/dashboard" element={<PrintingDashboard />} />
        <Route path="/printing/batch/:id" element={<PrintingBatchPage />} />
        <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
        <Route path="/skincare/dashboard" element={<SkincareDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;