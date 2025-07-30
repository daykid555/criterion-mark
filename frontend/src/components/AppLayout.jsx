// frontend/src/components/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = () => {
  return (
    // THIS IS THE FIX: Restoring the animated gradient background
    <div className="min-h-screen w-full bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4 sm:p-6 lg:p-8">
      <Navbar />
      <main className="pt-24"> {/* Add padding-top to push content below the fixed navbar */}
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
