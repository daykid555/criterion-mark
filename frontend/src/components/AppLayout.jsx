import { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from './Navbar';

const AppLayout = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen w-full bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4 sm:p-6 lg:p-8">
      {/* Centered Navbar with wax seal and logo */}
      <Navbar />
      {/* Logout button, centered below navbar */}
      <div className="flex justify-center mt-2 mb-8">
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg text-sm glass-button"
        >
          Logout
        </button>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
export default AppLayout; 