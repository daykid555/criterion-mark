// frontend/src/pages/AdminDashboard.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminApprovalQueue from '../components/AdminApprovalQueue';
import AdminHistory from '../components/AdminHistory';
import AdminRegistrationQueue from '../components/AdminRegistrationQueue';
import AdminManagement from '../components/AdminManagement'; // <-- NEW: Import the new component

function AdminDashboard() {
  // NEW: Add 'admins' to the possible active tabs
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Admin Dashboard</h1>
        <Link 
          to="/admin/map"
          className="glass-button-sm font-bold py-2 px-4 rounded-lg"
        >
          View Scan Map
        </Link>
      </div>
      
      {/* --- MODIFIED: Added a new button for Admin Management --- */}
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
        {/* NEW BUTTON */}
        <button 
          onClick={() => setActiveTab('admins')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'admins' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Manage Admins
        </button>
      </div>

      {/* --- MODIFIED: Added conditional rendering for the new component --- */}
      <div>
        {activeTab === 'queue' && <AdminApprovalQueue />}
        {activeTab === 'history' && <AdminHistory />}
        {activeTab === 'registrations' && <AdminRegistrationQueue />}
        {activeTab === 'admins' && <AdminManagement />}
      </div>
    </>
  );
}

export default AdminDashboard;