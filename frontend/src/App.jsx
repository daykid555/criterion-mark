import { useContext } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import AppLayout from './components/AppLayout.jsx';
import Navbar from './components/Navbar.jsx';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ManufacturerDashboard from './pages/ManufacturerDashboard.jsx';
import DvaDashboard from './pages/DvaDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminBatchDetailsPage from './pages/AdminBatchDetailsPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

// --- PROTECTED ROUTE LOGIC ---
// This remains the same, but it will now protect the entire AppLayout
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// This layout is now ONLY for Login and Verify pages
const PublicLayout = () => (
  <div className="min-h-screen w-full relative">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);

// --- APP COMPONENT ---
function App() {
  return (
    <Routes>
      {/* --- HOMEPAGE ROUTE (STANDALONE) --- */}
      {/* This route has no wrapping layout, so it has full control of the screen */}
      <Route path="/" element={<HomePage />} />

      {/* --- OTHER PUBLIC ROUTES --- */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/verify" element={<VerificationPage />} />
      </Route>

      {/* --- PROTECTED DASHBOARD ROUTES --- */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/manufacturer/dashboard" element={<ManufacturerDashboard />} />
        <Route path="/dva/dashboard" element={<DvaDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />
      </Route>
    </Routes>
  );
}

export default App;