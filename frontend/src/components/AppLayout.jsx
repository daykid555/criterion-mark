// frontend/src/components/AppLayout.jsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
      <div className="flex-1 flex flex-col overflow-x-hidden relative">
        {/* Hamburger Menu - always on top */}
        <header className="lg:hidden p-4 flex items-center flex-shrink-0 absolute top-0 left-0 z-30">
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white bg-black/40 backdrop-blur-sm rounded-full">
            <FiMenu size={24} />
          </button>
        </header>
        
        {/* The Outlet will render the component for the current route */}
        {/* For /scan, it will be QuickScanPage. For /history, it will be ScanHistoryPage */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;