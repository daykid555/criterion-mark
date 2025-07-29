// frontend/src/components/SystemSettings.jsx

import React, { useState } from 'react';
import apiClient from '../api';

function SystemSettings() {
  const [isResetting, setIsResetting] = useState(false);

  const handleSystemReset = async () => {
    const confirmation = prompt("This is a destructive action. You will download a backup of all data, and then all transactional data (batches, scans, etc.) will be permanently deleted. Type 'RESET' to confirm.");
    
    if (confirmation !== 'RESET') {
      alert('System reset cancelled.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await apiClient({
        method: 'post',
        url: '/api/admin/system-reset',
        responseType: 'blob', // Expect a zip file
      });

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'criterion_mark_backup.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('System data has been backed up and reset successfully.');

    } catch (err) {
      alert('System reset failed. Please check the server logs.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">System Settings</h2>
      <div className="glass-panel p-6 border-2 border-red-500/50">
        <h3 className="text-xl font-bold text-red-300">Danger Zone</h3>
        <p className="text-white/70 mt-2 mb-6 text-sm">These actions are irreversible and will permanently alter the application data.</p>
        
        <div className="flex flex-col sm:flex-row justify-between items-center bg-black/20 p-4 rounded-lg">
          <div>
            <p className="font-bold text-white">Reset System Data</p>
            <p className="text-xs text-white/60">Export all batches, users, and scans to a ZIP file and then delete them from the database.</p>
          </div>
          <button 
            onClick={handleSystemReset}
            disabled={isResetting}
            className="w-full sm:w-auto mt-4 sm:mt-0 font-bold py-2 px-4 rounded-lg glass-button bg-red-800/50 hover:bg-red-700/50 disabled:opacity-50"
          >
            {isResetting ? 'Processing...' : 'Export & Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;