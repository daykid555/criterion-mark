// frontend/src/components/DvaApprovalQueue.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api';
import Modal from './Modal'; // Import the Modal component

const STATUS_STYLES = {
    PENDING_DVA_APPROVAL: 'text-yellow-300 pulse-attention',
};

function DvaApprovalQueue() {
    const [pendingBatches, setPendingBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [currentBatchToReject, setCurrentBatchToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchPendingBatches = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/dva/pending-batches');
            setPendingBatches(response.data);
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
        } catch (_error) { // eslint-disable-line no-unused-vars
            alert('Failed to approve batch.');
        }
    };

    const handleRejectClick = (batch) => {
        setCurrentBatchToReject(batch);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            alert('Rejection reason cannot be empty.');
            return;
        }
        try {
            await apiClient.put(`/api/dva/batches/${currentBatchToReject.id}/reject`, { reason: rejectionReason });
            setShowRejectModal(false);
            setRejectionReason('');
            setCurrentBatchToReject(null);
            fetchPendingBatches(); // Refresh list
        } catch (_error) { // eslint-disable-line no-unused-vars
            alert('Failed to reject batch.');
        }
    };

    const handleCloseModal = () => {
        setShowRejectModal(false);
        setRejectionReason('');
        setCurrentBatchToReject(null);
    };

    if (isLoading) return <p className="text-white p-4">Loading approval queue...</p>;
    if (error) return <p className="text-red-300 p-4">{error}</p>;

    return (
        <div className="glass-panel p-4">
            {pendingBatches.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-white/70">There are no batches awaiting your approval.</p>
                </div>
            ) : (
                <div className="overflow-x-auto sm:overflow-x-visible">
                    <table className="w-full text-left text-sm text-white/90">
                        <thead className="bg-white/10 text-xs uppercase">
                            <tr>
                                <th className="p-4">Drug Name</th>
                                <th className="p-4">Manufacturer</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingBatches.map(batch => (
                                <tr key={batch.id} className="border-b border-white/10 hover:bg-white/5">
                                    <td className="p-4 font-medium">{batch.drugName}</td>
                                    <td className="p-4 opacity-70">{batch.manufacturer.companyName}</td>
                                    <td className="p-4">{batch.quantity.toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className={`glass-button-sm text-xs font-bold py-1 px-3 rounded-md text-center ${STATUS_STYLES[batch.status]}`}>
                                            {batch.status.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td className="p-4 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                        <button onClick={() => handleApprove(batch.id)} className="text-xs font-bold py-2 px-3 rounded-lg glass-button pulse-attention">
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleRejectClick(batch)}
                                            className="text-xs font-bold py-2 px-3 rounded-lg bg-red-600/40 text-red-200 border border-red-600/50 hover:bg-red-700/50 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showRejectModal && (
                <Modal title="Reject Batch" onClose={handleCloseModal}>
                    <p className="text-white/80 mb-4">
                        Please provide a reason for rejecting batch: <span className="font-bold">{currentBatchToReject?.drugName}</span>
                    </p>
                    <textarea
                        className="w-full p-3 rounded-lg bg-black/30 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason here..."
                    ></textarea>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={handleCloseModal}
                            className="py-2 px-4 rounded-lg bg-gray-600/40 text-gray-200 border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRejectSubmit}
                            className="py-2 px-4 rounded-lg bg-red-600/40 text-red-200 border border-red-600/50 hover:bg-red-700/50 transition-colors"
                        >
                            Submit Rejection
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default DvaApprovalQueue;
