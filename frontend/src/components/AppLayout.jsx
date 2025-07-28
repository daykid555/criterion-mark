// frontend/src/components/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // We will use the main public navbar

const AppLayout = () => {
  return (
    // The background gradient is now applied here
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 p-4 sm:p-6 lg:p-8">
      <Navbar />
      <main className="pt-24"> {/* Add padding-top to push content below the fixed navbar */}
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;