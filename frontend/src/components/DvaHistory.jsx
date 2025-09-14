import { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api';

const STATUS_STYLES = {
  PENDING_ADMIN_APPROVAL: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
  PENDING_PRINTING: 'bg-purple-400/20 text-purple-200 border border-purple-400/30',
  DELIVERED: 'bg-green-400/20 text-green-200 border border-green-400/30',
};

const DvaHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/api/dva/history');
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load action history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) return <p className="text-white p-4">Loading history...</p>;
  if (error) return <p className="text-red-300 p-4">{error}</p>;

  return (
    <div className="glass-panel p-4">
      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/70">No processed batches found in your history.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4 text-sm font-semibold opacity-80">Drug Name</th>
                <th className="p-4 text-sm font-semibold opacity-80">Manufacturer</th>
                <th className="p-4 text-sm font-semibold opacity-80">Status After Your Action</th>
                <th className="p-4 text-sm font-semibold opacity-80 no-wrap">Date Approved</th>
              </tr>
            </thead>
            <tbody>
              {history.map(batch => (
                <tr key={batch.id} className="border-b border-white/10">
                  <td className="p-4 font-medium">{batch.drugName}</td>
                  <td className="p-4 opacity-70">{batch.manufacturer.companyName}</td>
                  <td className="p-4 no-wrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[batch.status] || 'bg-gray-400/20 text-gray-200'}`}>
                      {batch.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 opacity-70 no-wrap">
                    {new Date(batch.dva_approved_at || batch.createdAt).toLocaleString()}
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

export default DvaHistory; 