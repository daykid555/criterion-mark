// frontend/src/components/DvaApprovalQueue.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
    PENDING_DVA_APPROVAL: 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30',
};

function DvaApprovalQueue() {
    const [pendingBatches, setPendingBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPendingBatches = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/dva/pending-batches');
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
            await apiClient.put(`/api/dva/batches/${batchId}/approve`);
            fetchPendingBatches(); // Refresh list
        } catch (err) {
            alert('Failed to approve batch.');
        }
    };

    const handleReject = async (batchId) => {
        const reason = prompt("Please provide a reason for rejecting this batch:");
        if (reason === null || reason.trim() === "") {
            return; // User cancelled or entered an empty reason
        }
        try {
            await apiClient.put(`/api/dva/batches/${batchId}/reject`, { reason });
            fetchPendingBatches(); // Refresh list
        } catch (err) {
            alert('Failed to reject batch.');
        }
    };

    if (isLoading) return <p className="text-white p-4">Loading approval queue...</p>;
    if (error) return <p className="text-red-300 p-4">{error}</p>;

    return (
        <div className="glass-panel p-2 sm:p-4">
            {pendingBatches.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-white/70">There are no batches awaiting your approval.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-white min-w-[700px]">
                        <thead className="border-b border-white/20 text-sm text-white/70">
                            <tr>
                                <th className="p-4">Drug Name</th>
                                <th className="p-4">Manufacturer</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {pendingBatches.map(batch => (
                                <tr key={batch.id}>
                                    <td className="p-4 font-medium">{batch.drugName}</td>
                                    <td className="p-4 opacity-70">{batch.manufacturer.companyName}</td>
                                    <td className="p-4">{batch.quantity.toLocaleString()}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[batch.status]}`}>
                                            {batch.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleReject(batch.id)} className="text-xs font-bold py-2 px-3 rounded-lg glass-button bg-red-800/50 hover:bg-red-700/50">
                                                Reject
                                            </button>
                                            <button onClick={() => handleApprove(batch.id)} className="text-xs font-bold py-2 px-3 rounded-lg glass-button pulse-attention">
                                                Approve
                                            </button>
                                        </div>
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

export default DvaApprovalQueue;