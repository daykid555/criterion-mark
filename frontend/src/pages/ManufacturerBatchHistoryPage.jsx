// frontend/src/pages/ManufacturerBatchHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import BatchHistoryTable from '../components/BatchHistoryTable';
import apiClient from '../api';

function ManufacturerBatchHistoryPage() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBatches = async () => {
    try {
      const response = await apiClient.get('/api/manufacturer/batches');
      setBatches(response.data);
    } catch (err) {
      setError('Failed to load batch history.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Batch History</h1>
      <div className="glass-panel p-4 sm:p-6">
        {isLoading && <p className="text-center text-white py-10">Loading history...</p>}
        {error && <p className="text-center text-red-300 py-10">{error}</p>}
        {!isLoading && !error && <BatchHistoryTable batches={batches} onRefreshData={fetchBatches} />}
      </div>
    </div>
  );
}

export default ManufacturerBatchHistoryPage;