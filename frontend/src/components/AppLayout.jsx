// frontend/src/components/AppLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#0d1117] flex">
      {/* --- Desktop Sidebar (Permanent) --- */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* --- Mobile Sidebar (Sliding) --- */}
      <div className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>
      
      {/* --- Mobile Overlay (Closes sidebar on click) --- */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsMobileNavOpen(false)}
        ></div>
      )}

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-x-hidden"> {/* Added overflow-x-hidden to prevent horizontal scroll issues from content */}
        {/* Mobile Header with Hamburger Menu */}
        <header className="lg:hidden p-4 flex items-center flex-shrink-0">
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white">
            <FiMenu size={24} />
          </button>
        </header>
        
        {/* THIS IS THE FIX: The gradient background is now correctly applied to the main content area that holds the Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-animated bg-[length:400%_400%] animate-gradient">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;