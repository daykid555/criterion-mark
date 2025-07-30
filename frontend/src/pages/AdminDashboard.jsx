// frontend/src/pages/AdminDashboard.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';

// Import ALL necessary components
import AdminApprovalQueue from '../components/AdminApprovalQueue';
import AdminHistory from '../components/AdminHistory';
import AdminRegistrationQueue from '../components/AdminRegistrationQueue';
import AdminManagement from '../components/AdminManagement';
import UserManagement from '../components/UserManagement';
import SystemSettings from '../components/SystemSettings';

function AdminDashboard() {
  // All possible tabs are now included
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">Admin Dashboard</h1>
        <Link to="/admin/map" className="glass-button-sm font-bold py-2 px-4 rounded-lg">
          View Scan Map
        </Link>
      </div>
      
      {/* This container allows the tabs to scroll horizontally on small screens */}
      <div className="flex border-b border-white/20 mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('queue')} className={`whitespace-nowrap py-2 px-4 text-lg font-medium ${activeTab === 'queue' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Approval Queue
        </button>
        <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Action History
        </button>
        <button onClick={() => setActiveTab('registrations')} className={`whitespace-nowrap py-2 px-4 text-lg font-medium ${activeTab === 'registrations' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Pending Registrations
        </button>
        <button onClick={() => setActiveTab('admins')} className={`whitespace-nowrap py-2 px-4 text-lg font-medium ${activeTab === 'admins' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Manage Admins
        </button>
        <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-2 px-4 text-lg font-medium ${activeTab === 'users' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Manage Users
        </button>
        <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap py-2 px-4 text-lg font-medium ${activeTab === 'settings' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          System Settings
        </button>
      </div>

      {/* This section now correctly renders all possible components */}
      <div>
        {activeTab === 'queue' && <AdminApprovalQueue />}
        {activeTab === 'history' && <AdminHistory />}
        {activeTab === 'registrations' && <AdminRegistrationQueue />}
        {activeTab === 'admins' && <AdminManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </>
  );
}

export default AdminDashboard;
