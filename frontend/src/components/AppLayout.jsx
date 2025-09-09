// frontend/src/components/AppLayout.jsx

import { useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useContext(AuthContext);

  // --- THIS IS THE KEY LOGIC ---
  // Determine if the current user should have the standard "portal" layout with padding.
  // The CUSTOMER role will NOT have this layout.
  const isPortalLayout = user?.role !== 'CUSTOMER';

  return (
    <div className="min-h-screen w-full flex bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>
      {/* Mobile Sliding Sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>
      {/* Mobile Overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* --- BUG FIX: Hamburger z-index is now higher to prevent being covered --- */}
        <header className="lg:hidden p-4 flex items-center flex-shrink-0 absolute top-0 left-0 z-30">
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white bg-black/40 backdrop-blur-sm rounded-full">
            <FiMenu size={24} />
          </button>
        </header>
        
        {/* --- DYNAMIC LAYOUT RENDERING --- */}
        {isPortalLayout ? (
          // For ADMIN, MANUFACTURER, etc., render with padding
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        ) : (
          // For CUSTOMER, render with NO padding, allowing pages to be full-screen
          <main className="flex-1">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
};

export default AppLayout;