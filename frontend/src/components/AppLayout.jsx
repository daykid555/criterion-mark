// frontend/src/components/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="min-h-screen w-full bg-[#0d1117] flex">
      <Sidebar />
      <div className="flex-1">
        {/* We apply the animated background to the main content area */}
        <main className="min-h-screen w-full bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;