import { useState, useEffect } from 'react'; // Import hooks
import axios from 'axios'; // Import axios

import RequestBatchForm from "../components/RequestBatchForm";
import BatchHistoryTable from '../components/BatchHistoryTable'; // Import the table
import apiClient from '../api';

function ManufacturerDashboard() {
  // State to hold the list of batches
  const [batches, setBatches] = useState([]);
  // State to handle loading and errors during fetch
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This function will fetch data from the backend
  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/manufacturer/batches');
      setBatches(response.data); // Store the fetched batches in state
    } catch (err) {
      setError('Failed to load batch history.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // useEffect runs once when the component first loads
  useEffect(() => {
    fetchBatches();
  }, []);

  // This function will be called from the form when a new batch is created
  const handleNewBatchSuccess = () => {
    // Refetch the list of batches to show the new one immediately
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
        {!isLoading && !error && <BatchHistoryTable batches={batches} />}
      </div>
    </>
  );
}

export default ManufacturerDashboard;
