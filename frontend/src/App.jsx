// frontend/src/App.jsx

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
import AdminMapPage from './pages/AdminMapPage.jsx'; // <-- NEW: Import the map page

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

const PublicLayout = () => (
  <div className="min-h-screen w-full relative">
    <Navbar />
    <main>
      <Outlet />
    </main>
  </div>
);

function App() {
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
        <Route path="/admin/batches/:id" element={<AdminBatchDetailsPage />} />
        <Route path="/admin/map" element={<AdminMapPage />} /> {/* <-- NEW: Add the route */}
      </Route>
    </Routes>
  );
}

export default App;