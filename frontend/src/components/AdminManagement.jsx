// frontend/src/components/AdminManagement.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

// --- A reusable Modal component for our forms ---
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className="glass-panel p-6 rounded-lg max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for our modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // State for the "Add Admin" form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  
  // State for the "Reset Code" form
  const [resetEmail, setResetEmail] = useState('');
  const [newCode, setNewCode] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });


  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/admin/admins');
      setAdmins(response.data);
    } catch (err) {
      setError('Failed to fetch admin list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const response = await apiClient.post('/api/admin/admins', {
        email: newAdminEmail,
        password: newAdminPassword,
        adminCode: adminCode,
      });
      setMessage({ type: 'success', text: response.data.message });
      // Clear form and close modal
      setNewAdminEmail('');
      setNewAdminPassword('');
      setAdminCode('');
      setIsAddModalOpen(false);
      // Refresh the list of admins
      fetchAdmins();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add admin.' });
    }
  };

  const handleResetCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
     try {
      const response = await apiClient.post('/api/admin/reset-code', {
        email: resetEmail,
        newCode: newCode,
      });
      setMessage({ type: 'success', text: response.data.message });
      // Clear form and close modal
      setResetEmail('');
      setNewCode('');
      setIsResetModalOpen(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset code.' });
    }
  };


  return (
    <div>
      {/* --- Main Display Area --- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">System Administrators</h2>
        <div className="flex gap-2">
            <button onClick={() => setIsAddModalOpen(true)} className="glass-button-sm font-bold py-2 px-4 rounded-lg">
                + Add Admin
            </button>
            <button onClick={() => setIsResetModalOpen(true)} className="text-xs text-white/60 hover:text-white">
                Forgot Code?
            </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
          {message.text}
        </div>
       )}

      <div className="glass-panel p-4">
        {isLoading && <p className="text-white/70">Loading admins...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!isLoading && (
          <ul className="divide-y divide-white/10">
            {admins.map(admin => (
              <li key={admin.id} className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{admin.companyName}</p>
                  <p className="text-sm text-white/60">{admin.email}</p>
                </div>
                <p className="text-xs text-white/50">Joined: {new Date(admin.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- "Add Admin" Modal --- */}
      {isAddModalOpen && (
        <Modal onClose={() => setIsAddModalOpen(false)}>
          <h3 className="text-xl font-bold text-white mb-4">Add New Administrator</h3>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <input type="email" placeholder="New Admin Email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="w-full glass-input px-3 py-2" required />
            <input type="password" placeholder="Temporary Password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="w-full glass-input px-3 py-2" required />
            <input type="text" placeholder="4-Digit Admin Code" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="w-full glass-input px-3 py-2" required />
            <button type="submit" className="w-full glass-button py-2 rounded-lg font-bold">Create Admin</button>
            {message.type === 'error' && <p className="text-red-400 text-xs text-center">{message.text}</p>}
          </form>
        </Modal>
      )}

      {/* --- "Reset Code" Modal --- */}
      {isResetModalOpen && (
        <Modal onClose={() => setIsResetModalOpen(false)}>
          <h3 className="text-xl font-bold text-white mb-4">Reset Admin Code</h3>
          <form onSubmit={handleResetCode} className="space-y-4">
            <p className="text-xs text-white/70">Enter the authorized email and a new 4-digit code.</p>
            <input type="email" placeholder="Your Email (daykid555@...)" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full glass-input px-3 py-2" required />
            <input type="text" placeholder="New 4-Digit Code" value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full glass-input px-3 py-2" required maxLength="4" />
            <button type="submit" className="w-full glass-button py-2 rounded-lg font-bold">Reset Code</button>
            {message.type === 'error' && <p className="text-red-400 text-xs text-center">{message.text}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AdminManagement;