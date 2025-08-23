// frontend/src/components/Sidebar.jsx
import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiGrid, FiUsers, FiLogOut, FiMap, FiPrinter, FiTruck, FiShoppingBag } from 'react-icons/fi';

const Logo = () => (
  <Link to="/" className="flex flex-col items-center pb-6 -space-y-1">
    <span className="text-xs text-white/80 tracking-widest">THE</span>
    <span className="text-xl font-bold text-white tracking-wider">CRITERION</span>
    <span className="text-sm text-white/80 tracking-widest">MARK</span>
  </Link>
);

const SidebarLink = ({ icon, text, to, action }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <li>
      <Link
        to={to}
        onClick={action}
        className={`
          flex items-center py-3 px-4 my-1
          font-medium rounded-md cursor-pointer
          transition-colors group
          ${isActive
            ? 'bg-gradient-to-tr from-white/20 to-white/10 text-white'
            : 'hover:bg-white/10 text-gray-400'
          }
      `}
      >
        {icon}
        <span className="w-40 ml-3">{text}</span>
      </Link>
    </li>
  );
};

// --- Navigation Links Configuration ---
const navConfig = {
  ADMIN: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/admin/dashboard' },
    { icon: <FiUsers size={20} />, text: 'User Management', to: '/admin/users' }, // Placeholder as per design
    { icon: <FiMap size={20} />, text: 'Map View', to: '/admin/map' },
  ],
  MANUFACTURER: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/manufacturer/dashboard' },
  ],
  DVA: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/dva/dashboard' },
  ],
  PRINTING: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/printing/dashboard' },
  ],
  LOGISTICS: [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/logistics/dashboard' },
  ],
  SKINCARE_BRAND: [
      { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/skincare/dashboard' },
  ],
  // Add other roles here as needed
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