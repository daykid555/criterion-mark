// frontend/src/pages/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Link is already here, which is great
import AdminApprovalQueue from '../components/AdminApprovalQueue';
import AdminHistory from '../components/AdminHistory';
import AdminRegistrationQueue from '../components/AdminRegistrationQueue';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <>
      {/* --- MODIFIED: Added a container and a new link to the map --- */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Admin Dashboard</h1>
        <Link 
          to="/admin/map"
          className="glass-button-sm font-bold py-2 px-4 rounded-lg" // Using a button style for prominence
        >
          View Scan Map
        </Link>
      </div>
      {/* --- End of modification --- */}
      
      <div className="flex border-b border-white/20 mb-8">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'queue' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Approval Queue
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Action History
        </button>
        <button 
          onClick={() => setActiveTab('registrations')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'registrations' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Pending Registrations
        </button>
      </div>

      <div>
        {activeTab === 'queue' && <AdminApprovalQueue />}
        {activeTab === 'history' && <AdminHistory />}
        {activeTab === 'registrations' && <AdminRegistrationQueue />}
      </div>
    </>
  );
}

export default AdminDashboard;