// frontend/src/pages/PrintingDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';

// --- Reusable Table Component for Printing Jobs ---
const JobsTable = ({ jobs, title, onUpdateStatus, isHistory = false }) => {
    const STATUS_STYLES = {
        PENDING_PRINTING: 'bg-purple-200 text-purple-800 pulse-attention-soft',
        PRINTING_IN_PROGRESS: 'bg-blue-200 text-blue-800 animate-pulse',
        PRINTING_COMPLETE: 'bg-green-200 text-green-800',
        IN_TRANSIT: 'bg-cyan-200 text-cyan-800',
        DELIVERED: 'bg-gray-200 text-gray-800',
    };

    if (jobs.length === 0) {
        return <p className="text-white/70 text-center py-8">{isHistory ? 'No completed jobs found.' : 'No active jobs in the queue.'}</p>;
    }

    return (
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
                    {jobs.map(job => (
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
                                {/* Action buttons only show in the active queue */}
                                {!isHistory && job.status === 'PENDING_PRINTING' && <button onClick={() => onUpdateStatus(job.id, 'start')} className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md">Start Printing</button>}
                                {!isHistory && job.status === 'PRINTING_IN_PROGRESS' && <button onClick={() => onUpdateStatus(job.id, 'complete')} className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-blue-500/30">Mark Complete</button>}
                                {/* THIS IS THE FIX: Download link is now the primary action for completed jobs */}
                                {isHistory && job.status.startsWith('PRINTING_COMPLETE') && 
                                    <Link to={`/printing/batch/${job.id}`} className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-green-500/30">
                                        Download Seals
                                    </Link>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


function PrintingDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
  const [queueJobs, setQueueJobs] = useState([]);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch data for both tabs at the same time
      const [pendingRes, inProgressRes, historyRes] = await Promise.all([
        apiClient.get('/api/printing/pending'),
        apiClient.get('/api/printing/in-progress'),
        apiClient.get('/api/printing/history')
      ]);
      setQueueJobs([...pendingRes.data, ...inProgressRes.data]);
      setHistoryJobs(historyRes.data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, action) => {
    try {
      await apiClient.put(`/api/printing/batches/${id}/${action}`);
      fetchData(); // Refetch all data to update both tabs correctly
    } catch (err) {
      setError(`Failed to update batch #${id}.`);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Printing Dashboard</h1>
      
      <div className="flex border-b border-white/20 mb-8">
        <button onClick={() => setActiveTab('queue')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'queue' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Active Queue
        </button>
        <button onClick={() => setActiveTab('history')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>
          Completed History
        </button>
      </div>
      
      {isLoading && <p className="text-white/70">Loading jobs...</p>}
      {error && <p className="text-red-400">{error}</p>}
      
      <div className="glass-panel p-1 sm:p-2">
        {!isLoading && !error && activeTab === 'queue' && <JobsTable jobs={queueJobs} onUpdateStatus={handleUpdateStatus} />}
        {!isLoading && !error && activeTab === 'history' && <JobsTable jobs={historyJobs} isHistory={true} />}
      </div>
    </div>
  );
}

export default PrintingDashboard;