// frontend/src/components/DvaApprovalQueue.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api';
import Modal from './Modal'; // Assuming a Modal component exists or will be created

const DvaApprovalQueue = () => {
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
    } catch (_error) {
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
      fetchPendingBatches();
    } catch (_error) {
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
      fetchPendingBatches();
    } catch (_error) {
      alert('Failed to reject batch.');
    }
  };

  const handleCloseModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setCurrentBatchToReject(null);
  };

  if (isLoading) return <p className="text-white">Loading pending batches...</p>;
  if (error) return <p className="text-red-300">{error}</p>;

  return (
    <div className="glass-panel p-6">
      <div className="space-y-4">
        {pendingBatches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/70">There are no batches awaiting your approval.</p>
          </div>
        ) : (
          pendingBatches.map(batch => (
            <div key={batch.id} className="bg-black/20 p-5 rounded-lg flex items-center justify-between">
              <div className="text-white">
                <div className="font-bold text-lg">{batch.drugName}</div>
                <div className="text-sm text-white/70 flex items-center space-x-2 mt-1">
                  <span>{batch.manufacturer.companyName}</span>
                  <span>|</span>
                  <span>Qty: {batch.quantity.toLocaleString()}</span>
                  <span>|</span>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 pulse-attention">
                    PENDING DVA APPROVAL
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(batch.id)}
                  className="font-bold py-2 px-4 rounded-lg glass-button pulse-attention"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRejectClick(batch)}
                  className="font-bold py-2 px-4 rounded-lg bg-red-600/40 text-red-200 border border-red-600/50 hover:bg-red-700/50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
};

export default DvaApprovalQueue;
