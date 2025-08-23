// frontend/src/components/AppLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* 
        THIS IS THE "CLICK AWAY" FIX:
        The sliding container is now restricted to the sidebar's width (`w-72`).
        This means the overlay behind it is now exposed and can be clicked to close.
      */}
      <div 
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>
      
      {/* Mobile Overlay (Closes sidebar on click) */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsMobileNavOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
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
};

export default AppLayout;