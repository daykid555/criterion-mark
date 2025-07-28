// frontend/src/pages/PrintingDashboard.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
  PENDING_PRINTING: 'bg-purple-100 text-purple-800',
  PRINTING_IN_PROGRESS: 'bg-blue-100 text-blue-800 animate-pulse',
  PRINTING_COMPLETE: 'bg-green-100 text-green-800',
};

function PrintingDashboard() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/printing/pending');
      setJobs(response.data);
    } catch (err) {
      setError('Failed to load printing jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (id, action) => {
    const url = `/api/printing/batches/${id}/${action}`; // action will be 'start' or 'complete'
    try {
      await apiClient.put(url);
      setMessage(`Batch #${id} status updated successfully.`);
      // Refresh the list to show the change
      fetchJobs();
      // Clear the message after a few seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(`Failed to update batch #${id}.`);
    }
  };

  if (isLoading) return <p className="text-white/70">Loading printing queue...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">Printing Job Queue</h1>
      
      {message && <div className="p-3 rounded-lg text-sm mb-4 bg-green-500/20 text-green-200">{message}</div>}

      <div className="glass-panel p-4">
        {jobs.length === 0 ? (
          <p className="text-white/70 text-center py-8">No jobs pending for printing.</p>
        ) : (
          <table className="w-full text-left text-white">
            <thead className="border-b border-white/20 text-sm text-white/70">
              <tr>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Product</th>
                <th className="p-4">Manufacturer</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.map(job => (
                <tr key={job.id}>
                  <td className="p-4 font-mono">#{job.id}</td>
                  <td className="p-4 font-semibold">{job.drugName}</td>
                  <td className="p-4">{job.manufacturer.companyName}</td>
                  <td className="p-4">{job.quantity.toLocaleString()}</td>
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[job.status] || 'bg-gray-100 text-gray-800'}`}>
                          {job.status.replace(/_/g, ' ')}
                      </span>
                  </td>
                  <td className="p-4 text-center">
                    {job.status === 'PENDING_PRINTING' && (
                      <button 
                        onClick={() => handleUpdateStatus(job.id, 'start')}
                        className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md"
                      >
                        Start Printing
                      </button>
                    )}
                    {job.status === 'PRINTING_IN_PROGRESS' && (
                      <button 
                        onClick={() => handleUpdateStatus(job.id, 'complete')}
                        className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-blue-500/30"
                      >
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PrintingDashboard;