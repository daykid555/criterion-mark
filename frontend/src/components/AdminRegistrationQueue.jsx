import { useState, useEffect } from 'react';
import apiClient from '../api';

const AdminRegistrationQueue = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/admin/pending-users');
      setPendingUsers(response.data);
    } catch (err) {
      setError('Failed to load pending user registrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleActivate = async (userId) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/activate`);
      // On success, refresh the list to remove the activated user
      fetchPendingUsers();
    } catch (err) {
      alert('Failed to activate user.');
    }
  };

  if (isLoading) return <p className="text-white p-4">Loading pending registrations...</p>;
  if (error) return <p className="text-red-300 p-4">{error}</p>;

  return (
    <div className="glass-panel p-4">
      {pendingUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/70">There are no new manufacturer registrations awaiting approval.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4 text-sm font-semibold opacity-80">Company Name</th>
                <th className="p-4 text-sm font-semibold opacity-80">Registration No.</th>
                <th className="p-4 text-sm font-semibold opacity-80">Email</th>
                <th className="p-4 text-sm font-semibold opacity-80 no-wrap">Date Registered</th>
                <th className="p-4 text-sm font-semibold opacity-80 no-wrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id} className="border-b border-white/10">
                  <td className="p-4 font-medium">{user.companyName}</td>
                  <td className="p-4 opacity-70">{user.companyRegNumber}</td>
                  <td className="p-4 opacity-70">{user.email}</td>
                  <td className="p-4 opacity-70 no-wrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 no-wrap">
                    <button
                      onClick={() => handleActivate(user.id)}
                      className="text-xs font-bold py-2 px-3 rounded-lg glass-button pulse-attention"
                    >
                      Activate Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationQueue; 