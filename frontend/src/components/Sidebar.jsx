// frontend/src/components/Sidebar.jsx

import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FiGrid, FiUsers, FiLogOut, FiMap, FiPrinter, FiTruck,
  FiCheckSquare, FiClock, FiSettings, FiUserPlus, FiPackage, FiFileText, 
  FiPlusCircle, FiArchive, FiHome, FiAlertTriangle, FiCamera // Added FiCamera
} from 'react-icons/fi';

const Logo = () => (
  <Link to="/" className="flex flex-col items-center pb-6 -space-y-1">
    <span className="text-xs text-white/80 tracking-widest">THE</span>
    <span className="text-xl font-bold text-white tracking-wider">CRITERION</span>
    <span className="text-sm text-white/80 tracking-widest">MARK</span>
  </Link>
);

const SidebarLink = ({ icon, text, to, action }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <li>
      <Link
        to={to}
        onClick={action}
        className={`flex items-center py-3 px-4 my-1 font-medium rounded-md cursor-pointer transition-colors group ${isActive ? 'bg-gradient-to-tr from-white/20 to-white/10 text-white' : 'hover:bg-white/10 text-gray-400'}`}
      >
        {icon}
        <span className="w-40 ml-3">{text}</span>
      </Link>
    </li>
  );
};

const navConfig = {
  ADMIN: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/admin/dashboard' },
    { icon: <FiCheckSquare size={20} />, text: 'Approval Queue', to: '/admin/approval-queue' },
    { icon: <FiUserPlus size={20} />, text: 'Pending Registrations', to: '/admin/registrations' },
    { icon: <FiUsers size={20} />, text: 'Manage Users', to: '/admin/users' },
    { icon: <FiFileText size={20} />, text: 'Reports Management', to: '/admin/reports' },
    { icon: <FiMap size={20} />, text: 'Scan Map', to: '/admin/map' },
    { icon: <FiClock size={20} />, text: 'Action History', to: '/admin/history' },
    { icon: <FiSettings size={20} />, text: 'System Settings', to: '/admin/settings' },
  ],
  MANUFACTURER: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/manufacturer/dashboard' },
    { icon: <FiPlusCircle size={20} />, text: 'Request New Batch', to: '/manufacturer/request-batch' },
    { icon: <FiArchive size={20} />, text: 'Assign Carton', to: '/manufacturer/assign-carton' },
    { icon: <FiPackage size={20} />, text: 'Batch History', to: '/manufacturer/batch-history' },
  ],
  DVA: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/dva/dashboard' },
    { icon: <FiCheckSquare size={20} />, text: 'Approval Queue', to: '/dva/approval-queue' },
    { icon: <FiClock size={20} />, text: 'Action History', to: '/dva/history' },
  ],
  PHARMACY: [
    { icon: <FiHome size={20} />, text: 'Dashboard', to: '/pharmacy/dashboard' },
    { icon: <FiCheckSquare size={20} />, text: 'Stock Management', to: '/pharmacy/stock' },
    { icon: <FiClock size={20} />, text: 'Dispense History', to: '/pharmacy/history' },
    { icon: <FiAlertTriangle size={20} />, text: 'Report Issue', to: '/report' },
  ],
  PRINTING: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/printing/dashboard' },
    { icon: <FiPrinter size={20} />, text: 'Active Print Queue', to: '/printing/queue' },
    { icon: <FiClock size={20} />, text: 'Completed History', to: '/printing/history' },
  ],
  LOGISTICS: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/logistics/dashboard' },
    { icon: <FiTruck size={20} />, text: 'Active Shipments', to: '/logistics/active' },
    { icon: <FiClock size={20} />, text: 'Delivery History', to: '/logistics/history' },
  ],
  SKINCARE_BRAND: [
      { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/skincare/dashboard' },
      { icon: <FiPlusCircle size={20} />, text: 'Add New Product', to: '/skincare/add-product' },
      { icon: <FiFileText size={20} />, text: 'Product History', to: '/skincare/history' },
  ],
  HEALTH_ADVISOR: [
    { icon: <FiAlertTriangle size={20} />, text: 'Action Required', to: '/health-advisor/dashboard/pending' },
    { icon: <FiArchive size={20} />, text: 'All Content', to: '/health-advisor/dashboard/all' },
    { icon: <FiPlusCircle size={20} />, text: 'Add New Content', to: '/health-advisor/create' },
  ],
  // --- ADDED CUSTOMER NAVIGATION ---
  CUSTOMER: [
    { icon: <FiCamera size={20} />, text: 'Scan Product', to: '/scan' },
    { icon: <FiClock size={20} />, text: 'Scan History', to: '/history' },
    { icon: <FiAlertTriangle size={20} />, text: 'Report Issue', to: '/report' },
  ],
};

export default function Sidebar({ closeMobileNav = () => {} }) {
  const { user, logout } = useContext(AuthContext);
  
  const handleLogout = () => {
    closeMobileNav();
    logout();
  };

  const userNavLinks = navConfig[user?.role] || [];

  return (
    <aside className="h-screen sticky top-0 w-72">
      <nav className="h-full flex flex-col glass-panel p-4">
        <div className="flex-shrink-0 mb-4 p-4">
          <Logo />
        </div>
        <ul className="flex-1 space-y-2">
          {userNavLinks.map((link) => (
            <SidebarLink key={link.text} {...link} action={closeMobileNav} />
          ))}
        </ul>
        <div className="border-t border-white/20 pt-4 mt-4">
          {user && (
            <div className="px-4 mb-4 text-left">
              <p className="text-white font-semibold text-sm truncate" title={user.companyName}>
                {user.companyName}
              </p>
              <p className="text-white/60 text-xs truncate" title={user.email}>
                {user.email}
              </p>
            </div>
          )}
          <div
            onClick={handleLogout}
            className="flex items-center py-3 px-4 my-1 font-medium rounded-md cursor-pointer transition-colors group hover:bg-red-500/20 text-gray-400"
          >
            <FiLogOut size={20} />
            <span className="w-40 ml-3">Logout</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}