// frontend/src/pages/PrintingQueuePage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Link } from 'react-router-dom'; // Import Link
import Table from '../components/Table'; // Import the new Table component

// Re-using the table component structure from the original dashboard
const STATUS_STYLES = {
    PENDING_PRINTING: 'text-purple-300 pulse-attention-soft',
    PRINTING_IN_PROGRESS: 'text-blue-300 animate-pulse'
};
const PrintingJobsTable = ({ jobs, onUpdateStatus }) => {
    if (jobs.length === 0) return <p className="text-center py-10 text-white/70">No active jobs in the queue.</p>;

    const headers = [
        "Batch ID",
        "Product",
        "Manufacturer",
        "Quantity",
        "Status",
        "Downloads",
        "Action"
    ];

    return (
        <Table headers={headers}>
            {jobs.map(job => (
                <tr key={job.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-4 font-mono">#{job.id}</td>
                    <td className="p-4 font-semibold">{job.drugName}</td>
                    <td className="p-4">{job.manufacturer.companyName}</td>
                    <td className="p-4">{job.quantity.toLocaleString()}</td>
                    <td className="p-4">
                        <div className={`glass-button-sm text-xs font-bold py-1 px-3 rounded-md text-center ${STATUS_STYLES[job.status] || 'text-white/70'}`}>
                            {job.status.replace(/_/g, ' ')}
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <Link to={`/printing/batch/${job.id}`} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-green-500/30">View/Download</Link>
                    </td>
                    <td className="p-4 text-center">
                        {job.status === 'PENDING_PRINTING' && <button onClick={() => onUpdateStatus(job.id, 'start')} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md">Start Printing</button>}
                        {job.status === 'PRINTING_IN_PROGRESS' && <button onClick={() => onUpdateStatus(job.id, 'complete')} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-blue-500/30">Mark Complete</button>}
                    </td>
                </tr>
            ))}
        </Table>
    );
};

function PrintingQueuePage() {
  const [queueJobs, setQueueJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true); setError('');
    try {
      const [pendingRes, inProgressRes] = await Promise.all([ apiClient.get('/api/printing/pending'), apiClient.get('/api/printing/in-progress') ]);
      setQueueJobs([...pendingRes.data, ...inProgressRes.data]);
    } catch (err) { setError('Failed to load queue data.'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (id, action) => {
    try {
      await apiClient.put(`/api/printing/batches/${id}/${action}`);
      fetchData();
    } catch (err) { alert(`Failed to update batch #${id}. Please try again.`); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Active Print Queue</h1>
      {error && <p className="text-center p-4 text-red-400">{error}</p>}
      <div className="glass-panel p-1 sm:p-2">
        {isLoading ? <p className="text-center p-8 text-white/70">Loading jobs...</p> : <PrintingJobsTable jobs={queueJobs} onUpdateStatus={handleUpdateStatus} />}
      </div>
    </div>
  );
}

export default PrintingQueuePage;
