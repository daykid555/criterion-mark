// frontend/src/pages/PrintingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';

// ... (Your STATUS_STYLES const can remain the same)
const STATUS_STYLES = {
  PENDING_PRINTING: 'bg-purple-200 text-purple-800 pulse-attention-soft',
  PRINTING_IN_PROGRESS: 'bg-blue-200 text-blue-800 animate-pulse',
  PRINTING_COMPLETE: 'bg-green-200 text-green-800',
};

function PrintingDashboard() {
    // ... (The state and functions can remain mostly the same, but let's ensure fetchJobs is correct)
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Fetch both pending and in-progress jobs to show a complete work queue
        const [pendingRes, inProgressRes] = await Promise.all([
          apiClient.get('/api/printing/pending'),
          apiClient.get('/api/printing/in-progress'),
        ]);
        setJobs([...pendingRes.data, ...inProgressRes.data]);
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
      try {
        await apiClient.put(`/api/printing/batches/${id}/${action}`);
        fetchJobs(); // Refresh the list
      } catch (err) {
        setError(`Failed to update batch #${id}.`);
      }
    };

    if (isLoading) return <p className="text-white/70">Loading printing queue...</p>;
    if (error) return <p className="text-red-400">{error}</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">Printing Job Queue</h1>
            
            {/* THIS IS THE FIX: Wrap the table in a div that allows horizontal scrolling on small screens */}
            <div className="glass-panel p-1 sm:p-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-white min-w-[800px]">
                        <thead className="border-b border-white/20 text-sm text-white/70">
                            <tr>
                                <th className="p-4">Batch ID</th>
                                <th className="p-4">Product</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                                <th className="p-4 text-center">Downloads</th> {/* <-- NEW HEADER */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {jobs.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-white/70">No active printing jobs.</td></tr>
                            ) : jobs.map(job => (
                                <tr key={job.id}>
                                    <td className="p-4 font-mono">#{job.id}</td>
                                    <td className="p-4 font-semibold">{job.drugName}</td>
                                    <td className="p-4">{job.quantity.toLocaleString()}</td>
                                    <td className="p-4">
                                        {/* THIS IS THE FIX: whitespace-nowrap prevents the text from breaking into two lines */}
                                        <span className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[job.status] || ''}`}>
                                            {job.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {job.status === 'PENDING_PRINTING' && <button onClick={() => handleUpdateStatus(job.id, 'start')} className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md">Start Printing</button>}
                                        {job.status === 'PRINTING_IN_PROGRESS' && <button onClick={() => handleUpdateStatus(job.id, 'complete')} className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-blue-500/30">Mark Complete</button>}
                                    </td>
                                    {/* --- NEW CELL FOR DOWNLOAD LINK --- */}
                                    <td className="p-4 text-center">
                                      {job.status === 'PRINTING_COMPLETE' ? (
                                        <Link 
                                          to={`/printing/batch/${job.id}`}
                                          className="glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-green-500/30"
                                        >
                                          Download Seals
                                        </Link>
                                      ) : (
                                        <span className="text-xs text-white/40 italic">N/A</span>
                                      )}
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

export default PrintingDashboard;