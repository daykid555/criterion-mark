// frontend/src/components/AppLayout.jsx

import { useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // --- THIS IS THE KEY LOGIC ---
  // A customer has a different, full-screen experience.
  const isCustomerPortal = user?.role === 'CUSTOMER';
  
  // The scanner page specifically should have no background or padding from the layout.
  const isScanPage = location.pathname === '/scan';

  // --- THE LAYOUT FOR EVERYONE EXCEPT CUSTOMERS ---
  if (!isCustomerPortal) {
    return (
      <div className="min-h-screen w-full flex">
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>
        <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
        </div>
        {isMobileNavOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)}></div>
        )}
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <header className="lg:hidden p-4 flex items-center flex-shrink-0">
            <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white">
              <FiMenu size={24} />
            </button>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  // --- THE DEDICATED LAYOUT FOR CUSTOMERS ---
  return (
    <div className="min-h-screen w-full flex bg-gray-900 relative">
      {/* Mobile sliding sidebar for all customer pages */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>
      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)}></div>
      )}

      {/* The main content area for the customer takes the full screen */}
      <div className="flex-1 relative">
        {/* The Hamburger menu is an overlay */}
        <header className="lg:hidden p-4 flex items-center flex-shrink-0 absolute top-0 left-0 z-30">
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white bg-black/40 backdrop-blur-sm rounded-full">
            <FiMenu size={24} />
          </button>
        </header>

        {/* The Outlet renders the current page (scan, history, or report) */}
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;