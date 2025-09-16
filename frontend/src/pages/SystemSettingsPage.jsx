import React from 'react';
import AdminUniversalWarningPage from './AdminUniversalWarningPage'; // Import the new page component
import BackButton from '../components/BackButton';

function SystemSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-8">
        <BackButton />
        <h1 className="text-3xl sm:text-4xl font-bold text-white ml-4 drop-shadow-lg">System Settings</h1>
      </div>
      {/* Render the AdminUniversalWarningPage here for now */}
      <AdminUniversalWarningPage />
    </div>
  );
}

export default SystemSettingsPage;