// frontend/src/pages/AdminHistoryPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // STEP 1: Import Link
import apiClient from '../api';
import { FiSearch, FiLoader } from 'react-icons/fi';

// The BatchHistoryTable component is now updated to include the link
const BatchHistoryTable = ({ batches }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm text-left text-white/90">
      <thead className="bg-white/10 text-xs uppercase">
        <tr>
          <th scope="col" className="px-6 py-3">Batch ID</th>
          <th scope="col" className="px-6 py-3">Drug Name</th>
          <th scope="col" className="px-6 py-3">Manufacturer</th>
          <th scope="col" className="px-6 py-3">Status</th>
          <th scope="col" className="px-6 py-3">Approved On</th>
        </tr>
      </thead>
      <tbody>
        {batches.map((batch) => (
          <tr key={batch.id} className="border-b border-white/10 hover:bg-white/5">
            <td className="px-6 py-4 font-mono">{batch.id}</td>
            {/* --- STEP 2: The drug name is now a clickable link --- */}
            <td className="px-6 py-4 font-bold">
              <Link 
                to={`/admin/batches/${batch.id}`} 
                className="hover:text-cyan-300 hover:underline transition-colors"
              >
                {batch.drugName}
              </Link>
            </td>
            {/* --- End of Change --- */}
            <td className="px-6 py-4">{batch.manufacturer.companyName}</td>
            <td className="px-6 py-4">{batch.status}</td>
            <td className="px-6 py-4">{new Date(batch.admin_approved_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


function AdminHistoryPage() {
  // --- START: NEW STATE MANAGEMENT ---
  const [batches, setBatches] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // --- END: NEW STATE MANAGEMENT ---

  // Debounce effect for search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const fetchHistory = useCallback(async (isNewSearch) => {
    // On a new search, we are in a main loading state
    if (isNewSearch) {
      setIsLoading(true);
      setBatches([]); // Reset batches for new search results
    } else {
      setIsLoadingMore(true); // Otherwise, it's just loading more items
    }
    setError(null);

    try {
      // The backend now expects 'page' and 'search' query params
      const response = await apiClient.get('/api/admin/history', {
        params: {
          page: isNewSearch ? 1 : page,
          search: debouncedSearchTerm,
        }
      });
      
      const { data, pagination } = response.data;
      
      // If it's a new search, replace the data. Otherwise, append it.
      setBatches(prev => isNewSearch ? data : [...prev, ...data]);
      setHasNextPage(pagination.hasNextPage);

    } catch (err) {
      setError('Failed to load batch history.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, debouncedSearchTerm]);

  // Effect to handle initial load and new searches
  useEffect(() => {
    setPage(1); // Reset page to 1 on a new search
    fetchHistory(true); // 'true' indicates it's a new search
  }, [debouncedSearchTerm]);
  
  // Effect to handle loading more data
  useEffect(() => {
    if (page > 1) {
      fetchHistory(false); // 'false' indicates we are loading more, not a new search
    }
  }, [page]);


  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Action History</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Drug or Manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-72 pl-10"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
        </div>
      </div>
      
      <div className="glass-panel p-1">
        {isLoading && batches.length === 0 ? (
          <p className="text-center p-8 text-white">Loading history...</p>
        ) : error ? (
          <p className="text-center p-8 text-red-300">{error}</p>
        ) : batches.length === 0 ? (
          <p className="text-center p-8 text-white/70">No history found matching your search.</p>
        ) : (
          <BatchHistoryTable batches={batches} />
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore} 
            className="font-bold py-3 px-6 rounded-lg glass-button flex items-center justify-center disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminHistoryPage;