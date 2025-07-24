import { useState, useEffect } from 'react';
import axios from 'axios';

const DvaApprovalQueue = () => {
  const [pendingBatches, setPendingBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingBatches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/dva/pending-batches');
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
      await axios.put(`http://localhost:5001/api/dva/batches/${batchId}/approve`);
      // Refresh the list to remove the approved batch
      fetchPendingBatches();
    } catch (err) {
      alert('Failed to approve batch.');
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
              <div>
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