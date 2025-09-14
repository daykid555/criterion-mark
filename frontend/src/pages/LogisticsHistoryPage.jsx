// frontend/src/pages/LogisticsHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = { DELIVERED: 'bg-gray-200 text-gray-800' };
const HistoryTable = ({ jobs }) => {
    if (jobs.length === 0) return <p className="text-center py-10 text-white/70">No delivery history found.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-white min-w-[800px]">
                <thead className="border-b border-white/20 text-sm text-white/70"><tr><th className="p-4">Batch ID</th><th className="p-4">Product</th><th className="p-4">Manufacturer</th><th className="p-4">Quantity</th><th className="p-4">Status</th></tr></thead>
                <tbody className="divide-y divide-white/10">
                    {jobs.map(job => (
                        <tr key={job.id}>
                            <td className="p-4 font-mono">#{job.id}</td><td className="p-4 font-semibold">{job.drugName}</td><td className="p-4">{job.manufacturer.companyName}</td><td className="p-4">{job.quantity.toLocaleString()}</td>
                            <td className="p-4"><span className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[job.status] || ''}`}>{job.status.replace(/_/g, ' ')}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

function LogisticsHistoryPage() {
  const [historyJobs, setHistoryJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true); setError('');
        try {
            const historyRes = await apiClient.get('/api/logistics/history');
            setHistoryJobs(historyRes.data);
        } catch (err) { setError('Failed to load history data.'); } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Delivery History</h1>
      {error && <p className="text-center p-4 text-red-400">{error}</p>}
      <div className="glass-panel p-1 sm:p-2">
        {isLoading ? <p className="text-center p-8 text-white/70">Loading history...</p> : <HistoryTable jobs={historyJobs} />}
      </div>
    </div>
  );
}

export default LogisticsHistoryPage;