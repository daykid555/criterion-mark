import { useState, useEffect } from 'react';
import apiClient from '../api';
import Table from './Table'; // Import the new Table component

const AdminRegistrationQueue = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  const headers = [
    "Company Name",
    "Registration No.",
    "Email",
    "Date Registered",
    "Action"
  ];

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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = pendingUsers.filter(user =>
    user.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.companyRegNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-4">
            <input
                type="text"
                placeholder="Search registrations..."
                className="w-full glass-input px-3 py-2"
                value={searchTerm}
                onChange={handleSearchChange}
            />
        </div>
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/70">No new manufacturer registrations awaiting approval.</p>
        </div>
      ) : (
        <Table headers={headers}>
          {filteredUsers.map(user => (
            <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
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
        </Table>
      )}
    </div>
  );
};

export default AdminRegistrationQueue;
 