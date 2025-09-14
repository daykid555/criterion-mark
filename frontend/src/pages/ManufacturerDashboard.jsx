import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ManufacturerOverviewWidget from '../components/ManufacturerOverviewWidget';

function ManufacturerDashboard() {
  const { user } = useContext(AuthContext);

  const companyName = user?.companyName || 'Manufacturer Portal';

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* Main content area */}
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-4">
          {companyName} Dashboard
        </h1>
        <p className="text-white/70 max-w-md mx-auto">
          Welcome to your Manufacturer Dashboard. Here's a quick overview of your operations.
        </p>
      </div>

      {/* Manufacturer Overview Widget */}
      <div className="w-full max-w-4xl">
        <ManufacturerOverviewWidget />
      </div>
    </div>
  );
}

export default ManufacturerDashboard;