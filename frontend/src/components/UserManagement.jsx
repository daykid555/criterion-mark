// frontend/src/components/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, MANUFACTURER, PRINTING, etc.

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // We need a new endpoint to get ALL manageable users
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

  const filteredUsers = users.filter(user => filter === 'ALL' || user.role === filter);

  if (isLoading) return <p className="text-white/70 text-center">Loading users...</p>;
  if (error) return <p className="text-red-400 text-center">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">Manage All Users</h2>
      {/* Add filtering UI later if needed */}
      <div className="glass-panel p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white min-w-[700px]">
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
                      className={`whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md ${user.isActive ? 'bg-red-500/30' : 'bg-green-500/30'}`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;