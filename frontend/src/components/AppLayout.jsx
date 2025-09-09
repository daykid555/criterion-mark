// frontend/src/components/AppLayout.jsx

import { useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useContext(AuthContext);

  // A customer has a different background color and full-screen pages
  const isCustomerPortal = user?.role === 'CUSTOMER';

  return (
    <div className={`min-h-screen w-full flex ${isCustomerPortal ? 'bg-gray-900' : ''}`}>
      {/* --- SIDEBARS (Desktop & Mobile) --- */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>
      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)}></div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* --- HEADER (for mobile) --- */}
        {/* This is now part of the normal document flow and will not overlap content */}
        <header className="lg:hidden p-4 flex items-center flex-shrink-0">
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white">
            <FiMenu size={24} />
          </button>
        </header>
        
        {/* --- MAIN CONTENT --- */}
        {/* For Customers, we use a different main element to allow full-screen pages */}
        {/* For everyone else, we use the standard padded layout */}
        {isCustomerPortal ? (
          <main className="flex-1 h-full"> {/* Let customer pages control their own padding */}
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
};

export default AppLayout;