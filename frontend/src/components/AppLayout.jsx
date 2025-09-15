import { useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const AppLayout = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // The scanner page specifically should have no background or padding from the layout.
  const isScanPage = location.pathname === '/scan';

  return (
    <div className="min-h-screen w-full flex">
      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar - Hidden by default, slides in from left */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 transition-transform duration-300 ease-in-out lg:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar closeMobileNav={() => setIsMobileNavOpen(false)} />
      </div>

      {/* Mobile Overlay - Darkens content when mobile sidebar is open */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileNavOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Mobile Header - Contains hamburger menu, visible only on small screens */}
        <header className="lg:hidden p-4 flex items-center flex-shrink-0">
          <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-white">
            <FiMenu size={24} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
