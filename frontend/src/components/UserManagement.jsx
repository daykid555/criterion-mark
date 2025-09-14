// frontend/src/components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import CreateUserModal from './CreateUserModal';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiX } from 'react-icons/fi';

// Custom Modal for Confirmation (replacing window.confirm)
const ConfirmationModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm text-white shadow-xl">
        <div className="p-6 text-center space-y-4">
          <FiAlertCircle className="text-5xl text-red-400 mx-auto" />
          <h3 className="text-xl font-bold">Confirm Action</h3>
          <p className="text-gray-300">{message}</p>
        </div>
        <div className="bg-gray-900/50 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/admin/users/all');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
        setError('Received an unexpected data format from the server.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActivation = async (userId) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/toggle-activation`);
      toast.success(response.data.message || 'User status updated!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const openConfirmationModal = (userId) => {
    setUserToDelete(userId);
    setIsConfirmModalOpen(true);
  };

  const handleRemoveUser = async () => {
    setIsConfirmModalOpen(false);
    const userId = userToDelete;
    if (!userId) return;

    const toastId = toast.loading('Deleting user...');
    try {
      const response = await apiClient.delete(`/api/admin/users/${userId}`);
      toast.success(response.data.message, { id: toastId });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user.', { id: toastId });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleUserCreationSuccess = () => {
    fetchUsers();
  };

  const renderContent = () => {
    if (isLoading) return <p className="text-white/70 text-center p-8">Loading users...</p>;
    if (error) return <p className="text-red-300 text-center p-8">{error}</p>;
    if (users.length === 0) return <p className="text-white/70 text-center p-8">No users found.</p>;

    return (
      <>
        {/* --- Desktop Table View --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead className="border-b border-white/20 text-sm text-white/70">
              <tr>
                <th className="p-4">Name / Company</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="p-4 font-semibold">{user.companyName}</td>
                  <td className="p-4 text-sm">{user.email}</td>
                  <td className="p-4 text-xs font-mono">{user.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4">
                    {/* FIXED: Use flexbox to keep buttons side-by-side */}
                    <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleToggleActivation(user.id)}
                          className={`min-w-[100px] whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md ${user.isActive ? 'bg-yellow-500/30 hover:bg-yellow-500/50' : 'bg-green-500/30 hover:bg-green-500/50'}`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => openConfirmationModal(user.id)}
                          className="min-w-[80px] whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-red-500/30 hover:bg-red-500/50"
                        >
                          Remove
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Mobile Card View --- */}
        <div className="md:hidden space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-white pr-2">{user.companyName}</h3>
                <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                  {user.isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <div className="text-sm text-white/80 space-y-1 mb-4">
                <div><span className="font-semibold text-white/60">Email: </span><span>{user.email}</span></div>
                <div><span className="font-semibold text-white/60">Role: </span><span className="font-mono text-xs">{user.role}</span></div>
              </div>
              
              {/* FIXED: Use a grid to ensure consistent two-column layout */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleToggleActivation(user.id)}
                  className={`text-center glass-button-sm text-sm font-bold py-2 px-3 rounded-md ${user.isActive ? 'bg-yellow-500/30 hover:bg-yellow-500/50' : 'bg-green-500/30 hover:bg-green-500/50'}`}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={() => openConfirmationModal(user.id)}
                  className="text-center glass-button-sm text-sm font-bold py-2 px-3 rounded-md bg-red-500/30 hover:bg-red-500/50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onConfirm={handleRemoveUser}
        onCancel={() => setIsConfirmModalOpen(false)}
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
      />
      {isModalOpen && (
        <CreateUserModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleUserCreationSuccess} 
        />
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Manage All Users</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="glass-button mt-3 sm:mt-0 font-bold py-2 px-4 rounded-lg"
        >
          Create New User
        </button>
      </div>
      <div className="glass-panel p-4">
        {renderContent()}
      </div>
    </div>
  );
}

export default UserManagement;