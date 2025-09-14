import { useState, useEffect } from 'react';
import apiClient from '../api';
import { Link } from 'react-router-dom';
import Table from './Table'; // Import the new Table component

const STATUS_STYLES = {
  PENDING_DVA_APPROVAL: 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30',
  PENDING_ADMIN_APPROVAL: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
  PENDING_PRINTING: 'bg-purple-400/20 text-purple-200 border border-purple-400/30',
  DELIVERED: 'bg-green-400/20 text-green-200 border border-green-400/30',
  ADMIN_REJECTED: 'bg-red-400/20 text-red-200 border border-red-400/30',
};


const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  const headers = [
    "Drug Name",
    "Manufacturer",
    "Final Status",
    "Date Processed"
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/api/admin/history');
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load action history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredHistory = history.filter(batch =>
    batch.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.manufacturer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <p className="text-white p-4">Loading history...</p>;
  if (error) return <p className="text-red-300 p-4">{error}</p>;

  return (
    <div className="glass-panel p-4">
        <div className="mb-4">
            <input
                type="text"
                placeholder="Search history..."
                className="w-full glass-input px-3 py-2"
                value={searchTerm}
                onChange={handleSearchChange}
            />
        </div>
         {filteredHistory.length === 0 ? (
             <div className="text-center py-8">
                <p className="text-white/70">No processed batches found matching your search.</p>
            </div>
         ) : (
            <Table headers={headers}>
                {filteredHistory.map(batch => (
                <tr key={batch.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-4 font-medium">
                        <Link to={`/admin/batches/${batch.id}`} className="hover:underline">{batch.drugName}</Link>
                    </td>
                    <td className="p-4 opacity-70">{batch.manufacturer.companyName}</td>
                    <td className="p-4 no-wrap">
                        <span className={`
                            px-3 py-1 text-xs font-medium rounded-full 
                            ${STATUS_STYLES[batch.status]}
                            ${(batch.status.includes('PENDING')) ? 'pulse-attention' : ''}
                        `}>
                            {batch.status.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td className="p-4 opacity-70 no-wrap">
                        {/* We show the admin approval date, or the creation date as a fallback */}
                        {new Date(batch.admin_approved_at || batch.createdAt).toLocaleString()}
                    </td>
                </tr>
                ))}
            </Table>
         )}
    </div>
  );
};

export default AdminHistory;
 