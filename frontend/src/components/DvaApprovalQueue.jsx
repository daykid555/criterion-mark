// frontend/src/components/DvaApprovalQueue.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api';

const DvaApprovalQueue = () => {
  const [pendingBatches, setPendingBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingBatches = async () => { /* ... (This function is unchanged) ... */ };
  useEffect(() => { fetchPendingBatches(); }, []);

  const handleApprove = async (batchId) => { /* ... (This function is unchanged) ... */ };

  // --- NEW: Function to handle rejection ---
  const handleReject = async (batchId) => {
    const reason = prompt("Please provide a reason for rejecting this batch:");
    if (reason === null || reason.trim() === "") {
      // User cancelled or entered an empty reason
      return;
    }

    try {
      await apiClient.put(`/api/dva/batches/${batchId}/reject`, { reason });
      fetchPendingBatches(); // Refresh the list
    } catch (err) {
      alert('Failed to reject batch.');
    }
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
            <div key={batch.id} className="bg-black/20 p-5 rounded-lg flex flex-col sm:flex-row items-center justify-between">
              <div className="text-white mb-4 sm:mb-0">
                <div className="font-bold text-lg">{batch.drugName}</div>
                <div className="text-sm text-white/70 flex flex-wrap items-center gap-x-2 mt-1">
                  <span>{batch.manufacturer.companyName}</span>
                  <span>|</span>
                  <span>Qty: {batch.quantity.toLocaleString()}</span>
                  <span className="mt-2 sm:mt-0 w-full sm:w-auto px-3 py-1 text-xs font-medium rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 pulse-attention">
                    PENDING DVA APPROVAL
                  </span>
                </div>
              </div>
              {/* --- MODIFIED: Added a Reject button --- */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(batch.id)}
                  className="font-bold py-2 px-4 rounded-lg glass-button bg-red-800/50 hover:bg-red-700/50 text-xs"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(batch.id)}
                  className="font-bold py-2 px-4 rounded-lg glass-button pulse-attention"
                >
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DvaApprovalQueue;