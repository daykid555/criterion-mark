// frontend/src/components/Sidebar.jsx
import { useState, useContext, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiGrid, FiUsers, FiLogOut, FiChevronLeft } from 'react-icons/fi'; // Using Feather Icons for a clean look

const SidebarContext = createContext();

const Logo = () => (
  <div className="flex flex-col items-center pb-6 -space-y-1">
    <span className="text-xs text-white/80 tracking-widest">THE</span>
    <span className="text-xl font-bold text-white tracking-wider">CRITERION</span>
    <span className="text-sm text-white/80 tracking-widest">MARK</span>
  </div>
);

const SidebarLink = ({ icon, text, to }) => {
  const { isExpanded } = useContext(SidebarContext);
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        relative flex items-center py-3 px-4 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${isActive
          ? 'bg-gradient-to-tr from-white/20 to-white/10 text-white'
          : 'hover:bg-white/10 text-gray-400'
        }
    `}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${isExpanded ? 'w-40 ml-3' : 'w-0'}`}>{text}</span>
      {!isExpanded && (
        <div className={`
          absolute left-full rounded-md px-2 py-1 ml-6
          bg-gray-900 text-white text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
        `}>
          {text}
        </div>
      )}
    </Link>
  );
};

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user, logout } = useContext(AuthContext); // Assuming 'user' object has a 'role' property

  // In a real app, you would generate these links based on user.role
  const navLinks = [
    { icon: <FiGrid size={20} />, text: 'Dashboard', to: '/dashboard' },
    { icon: <FiUsers size={20} />, text: 'User Management', to: '/admin/users' },
  ];

  return (
    <aside className="h-screen sticky top-0">
      <nav className="h-full flex flex-col glass-panel p-4">
        <SidebarContext.Provider value={{ isExpanded }}>
          <div className="flex-shrink-0 mb-4 p-4">
            <Logo />
          </div>

          <ul className="flex-1 space-y-2">
            {navLinks.map((link) => (
              <SidebarLink key={link.text} {...link} />
            ))}
          </ul>
        </SidebarContext.Provider>

        <div className="border-t border-white/20 pt-4 mt-4">
          <div
            onClick={logout}
            className="relative flex items-center py-3 px-4 my-1 font-medium rounded-md cursor-pointer transition-colors group hover:bg-red-500/20 text-gray-400"
          >
            <FiLogOut size={20} />
            <span className={`overflow-hidden transition-all ${isExpanded ? 'w-40 ml-3' : 'w-0'}`}>Logout</span>
          </div>
        </div>

        {/* --- Manual Control Arrow --- */}
        <div className="pt-4 mt-auto flex justify-end group/arrow">
          <button
            onClick={() => setIsExpanded((curr) => !curr)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-60 group-hover/arrow:opacity-100"
          >
            <FiChevronLeft size={24} className={`text-white transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </nav>
    </aside>
  );
}