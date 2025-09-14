// frontend/src/pages/SystemSettingsPage.jsx
import React from 'react';
import SystemSettings from '../components/SystemSettings';

function SystemSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">System Settings</h1>
      <SystemSettings />
    </div>
  );
}

export default SystemSettingsPage;