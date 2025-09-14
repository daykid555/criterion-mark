// frontend/src/pages/DvaDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DvaOverviewWidget from '../components/DvaOverviewWidget';

function DvaDashboard() {
  const { user } = useContext(AuthContext);

  const agentName = user?.companyName || 'DVA Portal';

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* Main content area */}
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-4">
          {agentName} Dashboard
        </h1>
        <p className="text-white/70 max-w-md mx-auto">
          Welcome to your DVA Dashboard. Here's a quick overview of your tasks and performance.
        </p>
      </div>

      {/* DVA Overview Widget */}
      <div className="w-full max-w-4xl">
        <DvaOverviewWidget />
      </div>
    </div>
  );
}

export default DvaDashboard;