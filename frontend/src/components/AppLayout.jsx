// frontend/src/components/AppLayout.jsx

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import QuickScanPage from '../pages/QuickScanPage'; // We need to render this directly

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // --- THIS IS THE KEY LOGIC ---
  // Check if the current page should be full-screen (the customer's scanner dashboard)
  const isFullScreenPage = location.pathname === '/scan';

  // If it's the full-screen scanner page, we render a completely different layout.
  if (isFullScreenPage) {
    return (
      <div className="min-h-screen w-full flex">
        {/* We still render the sidebar so it's available for mobile */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>
        <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
        </div>
        {isMobileNavOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)}></div>
        )}
        
        {/* The main content area is now JUST the scanner page */}
        <div className="flex-1 relative">
           {/* Mobile Menu Button, now an overlay on top of the scanner */}
          <header className="lg:hidden absolute top-0 left-0 p-4 z-10">
            <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white bg-black/30 rounded-full">
              <FiMenu size={24} />
            </button>
          </header>
          {/* We render the QuickScanPage directly, which will fill the entire area */}
          <QuickScanPage />
        </div>
      </div>
    );
  }

  // --- For all other pages, render the standard layout ---
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
          <Outlet /> {/* Renders history, report, and all other pages */}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;