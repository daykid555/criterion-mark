// frontend/src/pages/LogisticsDashboard.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
  PRINTING_COMPLETE: 'bg-green-200 text-green-800 pulse-attention-soft',
  IN_TRANSIT: 'bg-cyan-200 text-cyan-800 animate-pulse',
  DELIVERED: 'bg-gray-200 text-gray-800',
};

const LogisticsJobsTable = ({ jobs, onUpdateStatus, isHistory }) => {
    if (jobs.length === 0) {
        return <p className="text-center py-10 text-white/70">{isHistory ? 'No delivery history found.' : 'No batches are currently ready for pickup.'}</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-white min-w-[800px]">
                <thead className="border-b border-white/20 text-sm text-white/70">
                    <tr>
                        <th className="p-4">Batch ID</th><th className="p-4">Product</th><th className="p-4">Manufacturer</th><th className="p-4">Quantity</th><th className="p-4">Status</th><th className="p-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {jobs.map(job => (
                        <tr key={job.id}>
                            <td className="p-4 font-mono">#{job.id}</td><td className="p-4 font-semibold">{job.drugName}</td><td className="p-4">{job.manufacturer.companyName}</td><td className="p-4">{job.quantity.toLocaleString()}</td>
                            <td className="p-4">
                                <span className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[job.status] || ''}`}>
                                    {job.status.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                {!isHistory && job.status === 'PRINTING_COMPLETE' && <button onClick={() => onUpdateStatus(job.id, 'pickup')} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md">Mark Picked Up</button>}
                                {!isHistory && job.status === 'IN_TRANSIT' && <button onClick={() => onUpdateStatus(job.id, 'deliver')} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-cyan-500/30">Mark Delivered</button>}
                                {isHistory && <span className="text-xs text-white/50 italic">Completed</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

function LogisticsDashboard() {
  const [activeTab, setActiveTab] = useState('queue');
  const [queueJobs, setQueueJobs] = useState([]);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [queueRes, historyRes] = await Promise.all([
        apiClient.get('/api/logistics/pending-pickup'),
        apiClient.get('/api/logistics/history')
      ]);
      setQueueJobs(queueRes.data);
      setHistoryJobs(historyRes.data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (id, action) => {
    // For now, we are not collecting notes, but we can add a modal here later.
    // e.g. const notes = prompt("Enter notes (optional):");
    const notes = null; 

    try {
      // --- FIX [2]: Added a request body `{}` to the PUT request. ---
      // This sends an empty object to the backend, preventing req.body from being undefined
      // and thus stopping the 500 Internal Server Error crash.
      const payload = action === 'pickup' ? { pickup_notes: notes } : { delivery_notes: notes };
      await apiClient.put(`/api/logistics/batches/${id}/${action}`, payload);
      fetchData(); // Refresh data on success
    } catch (err) {
      console.error('Update status error:', err);
      // Check if there's a more specific error message from the backend
      const errorMessage = err.response?.data?.error || `Failed to update batch #${id}. Please try again.`;
      setError(errorMessage);
    }
  };

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Logistics Dashboard</h1>
      <div className="flex border-b border-white/20 mb-8">
        <button onClick={() => setActiveTab('queue')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'queue' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>Pickup Queue</button>
        <button onClick={() => setActiveTab('history')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>Delivery History</button>
      </div>
      
      {error && <p className="text-center p-4 text-red-400 bg-red-500/10 rounded-lg">{error}</p>}

      <div className="glass-panel p-1 sm:p-2">
        {isLoading ? <p className="text-center p-8 text-white/70">Loading jobs...</p> : (
          activeTab === 'queue' ? <LogisticsJobsTable jobs={queueJobs} onUpdateStatus={handleUpdateStatus} isHistory={false} /> : <LogisticsJobsTable jobs={historyJobs} onUpdateStatus={handleUpdateStatus} isHistory={true} />
        )}
      </div>
    </div>
  );
}

export default LogisticsDashboard;