// frontend/src/pages/LogisticsDashboard.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
  PRINTING_COMPLETE: 'bg-green-200 text-green-800 pulse-attention-soft',
  IN_TRANSIT: 'bg-cyan-200 text-cyan-800 animate-pulse',
  DELIVERED: 'bg-gray-200 text-gray-800',
};

function LogisticsDashboard() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      // For now, we only need the batches that are ready for pickup.
      // We can add a history tab later if needed.
      const response = await apiClient.get('/api/logistics/pending-pickup');
      setJobs(response.data);
    } catch (err) {
      setError('Failed to load logistics jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (id, action) => {
    try {
      // We will expand this to include notes later if needed.
      await apiClient.put(`/api/logistics/batches/${id}/${action}`);
      fetchJobs(); // Refresh the list after an update
    } catch (err) {
      setError(`Failed to update batch #${id}.`);
    }
  };

  if (isLoading) return <p className="text-white/70">Loading logistics queue...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">Logistics Dashboard</h1>

      <div className="glass-panel p-1 sm:p-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white min-w-[800px]">
            <thead className="border-b border-white/20 text-sm text-white/70">
              <tr>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Product</th>
                <th className="p-4">Manufacturer</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10 text-white/70">No batches are currently ready for pickup.</td></tr>
              ) : jobs.map(job => (
                <tr key={job.id}>
                  <td className="p-4 font-mono">#{job.id}</td>
                  <td className="p-4 font-semibold">{job.drugName}</td>
                  <td className="p-4">{job.manufacturer.companyName}</td>
                  <td className="p-4">{job.quantity.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[job.status] || ''}`}>
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {job.status === 'PRINTING_COMPLETE' && <button onClick={() => handleUpdateStatus(job.id, 'pickup')} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md">Mark as Picked Up</button>}
                    {job.status === 'IN_TRANSIT' && <button onClick={() => handleUpdateStatus(job.id, 'deliver')} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-cyan-500/30">Mark as Delivered</button>}
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

export default LogisticsDashboard;