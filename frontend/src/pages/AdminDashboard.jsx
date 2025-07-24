import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdminApprovalQueue from '../components/AdminApprovalQueue';
import AdminHistory from '../components/AdminHistory';
import AdminRegistrationQueue from '../components/AdminRegistrationQueue';

// (The STATUS_STYLES const can be moved to a separate file later if needed)
const STATUS_STYLES = {
  PENDING_DVA_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PENDING_ADMIN_APPROVAL: 'bg-blue-100 text-blue-800',
  PENDING_PRINTING: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  ADMIN_REJECTED: 'bg-red-100 text-red-800',
};

function AdminDashboard() {
  // Add 'registrations' to the possible active tabs
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'history', or 'registrations'

  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
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
        {/* ADD THIS NEW BUTTON */}
        <button 
          onClick={() => setActiveTab('registrations')}
          className={`py-2 px-4 text-lg font-medium ${activeTab === 'registrations' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}
        >
          Pending Registrations
        </button>
      </div>

      {/* Conditional Rendering of Tabs */}
      <div>
        {activeTab === 'queue' && <AdminApprovalQueue />}
        {activeTab === 'history' && <AdminHistory />}
        {/* ADD THIS NEW CONDITIONAL RENDER */}
        {activeTab === 'registrations' && <AdminRegistrationQueue />}
      </div>
    </>
  );
}

export default AdminDashboard;