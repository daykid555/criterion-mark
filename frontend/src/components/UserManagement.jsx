// frontend/src/components/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import CreateUserModal from './CreateUserModal'; // Import the modal component

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, MANUFACTURER, PRINTING, etc.
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the modal

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/admin/users/all');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActivation = async (userId) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/toggle-activation`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const handleUserCreationSuccess = () => {
    fetchUsers(); // Refresh the user list after successful creation
  };

  const filteredUsers = users.filter(user => filter === 'ALL' || user.role === filter);

  if (isLoading) return <p className="text-white/70 text-center">Loading users...</p>;
  if (error) return <p className="text-red-400 text-center">{error}</p>;

  return (
    <div>
      {/* Conditionally render the modal */}
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
      
      {/* Rest of the component remains the same */}
      <div className="glass-panel p-4">

        {/* --- Desktop Table View (Visible on medium screens and up) --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead className="border-b border-white/20 text-sm text-white/70">
              <tr>
                <th className="p-4">Name / Company</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="p-4 font-semibold">{user.companyName}</td>
                  <td className="p-4 text-sm">{user.email}</td>
                  <td className="p-4 text-xs font-mono">{user.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleToggleActivation(user.id)}
                      className={`whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md ${user.isActive ? 'bg-red-500/30 hover:bg-red-500/50' : 'bg-green-500/30 hover:bg-green-500/50'}`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Mobile Card View (Visible on small screens) --- */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-white pr-2">{user.companyName}</h3>
                <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {user.isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>

              <div className="text-sm text-white/80 space-y-1 mb-4">
                <div>
                  <span className="font-semibold text-white/60">Email: </span>
                  <span>{user.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-white/60">Role: </span>
                  <span className="font-mono text-xs">{user.role}</span>
                </div>
              </div>

              <button 
                onClick={() => handleToggleActivation(user.id)}
                className={`w-full glass-button-sm text-sm font-bold py-2 px-3 rounded-md ${user.isActive ? 'bg-red-500/30 hover:bg-red-500/50' : 'bg-green-500/30 hover:bg-green-500/50'}`}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default UserManagement;