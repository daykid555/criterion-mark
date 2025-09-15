// frontend/src/pages/AdminDashboard.jsx
import React from 'react';
import PendingNotificationsWidget from '../components/PendingNotificationsWidget';


function AdminDashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* Main content area */}
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-4">
          Admin Dashboard
        </h1>
        <p className="text-white/70 max-w-md mx-auto">
          Welcome to the Admin Dashboard. Below you'll find an overview of pending actions requiring your attention.
        </p>
      </div>

      {/* Pending Notifications Widget */}
      <div className="w-full max-w-4xl mb-8">
        <PendingNotificationsWidget />
      </div>

      
    </div>
  );
}

export default AdminDashboard;