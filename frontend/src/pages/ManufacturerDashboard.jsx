import { useState, useEffect } from 'react';
import RequestBatchForm from "../components/RequestBatchForm";
import BatchHistoryTable from '../components/BatchHistoryTable';
import apiClient from '../api';

function ManufacturerDashboard() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBatches = async () => {
    try {
      // Don't set loading to true on refetch, makes the UI flicker
      // setIsLoading(true);
      const response = await apiClient.get('/api/manufacturer/batches');
      setBatches(response.data);
    } catch (err) {
      setError('Failed to load batch history.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBatches();
  }, []);

  const handleNewBatchSuccess = () => {
    fetchBatches();
  };
  
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">
        Manufacturer Dashboard
      </h1>
      
      <div className="glass-panel p-8 mb-8">
        <RequestBatchForm onSuccess={handleNewBatchSuccess} />
      </div>

      <div className="glass-panel p-8">
        {isLoading && <p className="text-center text-white">Loading history...</p>}
        {error && <p className="text-center text-red-300">{error}</p>}
        {!isLoading && !error && <BatchHistoryTable batches={batches} onRefreshData={fetchBatches} />}
      </div>
    </>
  );
}

export default ManufacturerDashboard;