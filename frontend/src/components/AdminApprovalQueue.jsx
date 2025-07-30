// frontend/src/components/AdminApprovalQueue.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api';
import { Link } from 'react-router-dom';

const STATUS_STYLES = { PENDING_ADMIN_APPROVAL: 'bg-blue-400/20 text-blue-200 border border-blue-400/30' };

const AdminApprovalQueue = () => {
  const [pendingBatches, setPendingBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingBatches = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/admin/pending-batches');
      setPendingBatches(response.data);
    } catch (err) {
      setError('Failed to load pending batches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBatches();
  }, []);

  const handleApprove = async (batchId) => {
    try {
      await apiClient.put(`/api/admin/batches/${batchId}/approve`);
      fetchPendingBatches();
    } catch (err) {
      alert('Failed to approve batch.');
    }
  };

  if (isLoading) return <p className="text-white p-4">Loading approval queue...</p>;
  if (error) return <p className="text-red-300 p-4">{error}</p>;

  return (
    <div className="glass-panel p-4">
        {pendingBatches.length === 0 ? (
             <div className="text-center py-8">
                <p className="text-white/70">There are no batches awaiting final approval.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                <thead>
                    <tr className="border-b border-white/20">
                    <th className="p-4 text-sm font-semibold opacity-80">Drug Name</th>
                    <th className="p-4 text-sm font-semibold opacity-80">Manufacturer</th>
                    <th className="p-4 text-sm font-semibold opacity-80">Status</th>
                    <th className="p-4 text-sm font-semibold opacity-80 whitespace-nowrap">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingBatches.map(batch => (
                    <tr key={batch.id} className="border-b border-white/10">
                        <td className="p-4 font-medium">
                            <Link to={`/admin/batches/${batch.id}`} className="hover:underline">{batch.drugName}</Link>
                        </td>
                        <td className="p-4 opacity-70">{batch.manufacturer.companyName}</td>
                        <td className="p-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[batch.status]}`}>
                            {batch.status.replace(/_/g, ' ')}
                        </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                            <button onClick={() => handleApprove(batch.id)} className="text-xs font-bold py-2 px-3 rounded-lg glass-button pulse-attention">
                                Approve for Printing
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

export default AdminApprovalQueue;