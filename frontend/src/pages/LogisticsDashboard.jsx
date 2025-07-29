// frontend/src/pages/LogisticsDashboard.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
  PRINTING_COMPLETE: 'bg-green-200 text-green-800 pulse-attention-soft',
  IN_TRANSIT: 'bg-cyan-200 text-cyan-800 animate-pulse',
  DELIVERED: 'bg-gray-200 text-gray-800',
};

// --- Reusable Table Component for Logistics ---
const LogisticsJobsTable = ({ jobs, onUpdateStatus, isHistory }) => {
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
                    {jobs.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-10 text-white/70">{isHistory ? 'No delivery history found.' : 'No batches ready for pickup.'}</td></tr>
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
    try {
      await apiClient.put(`/api/logistics/batches/${id}/${action}`);
      fetchData(); // Refetch both tabs
    } catch (err) {
      setError(`Failed to update batch #${id}.`);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Logistics Dashboard</h1>
      <div className="flex border-b border-white/20 mb-8">
        <button onClick={() => setActiveTab('queue')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'queue' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>Pickup Queue</button>
        <button onClick={() => setActiveTab('history')} className={`py-2 px-4 text-lg font-medium ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`}>Delivery History</button>
      </div>
      
      {isLoading && <p className="text-center p-8 text-white/70">Loading jobs...</p>}
      {error && <p className="text-center p-8 text-red-400">{error}</p>}

      {!isLoading && !error && (
        <div className="glass-panel p-1 sm:p-2">
          {activeTab === 'queue' && <LogisticsJobsTable jobs={queueJobs} onUpdateStatus={handleUpdateStatus} isHistory={false} />}
          {activeTab === 'history' && <LogisticsJobsTable jobs={historyJobs} isHistory={true} />}
        </div>
      )}
    </div>
  );
}

export default LogisticsDashboard;