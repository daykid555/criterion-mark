// frontend/src/components/AppLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    // THIS IS THE FIX: ALL incorrect background classes (`bg-gradient-animated`, `bg-[#0d1117]`) have been REMOVED.
    // This div is now transparent, allowing the BODY background to be visible.
    <div className="min-h-screen w-full flex">
      
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      <div className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>
      
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={() => setIsMobileNavOpen(false)}
        ></div>
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
};

export default AppLayout;