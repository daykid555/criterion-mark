import { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api';
import Table from './Table'; // Import the new Table component

const STATUS_STYLES = {
  PENDING_ADMIN_APPROVAL: 'text-blue-300',
  PENDING_PRINTING: 'text-purple-300',
  DELIVERED: 'text-green-300',
  ADMIN_REJECTED: 'text-red-300',
  DVA_REJECTED: 'text-red-300',
  PRINTING_COMPLETE: 'text-blue-300',
  DELIVERED_TO_MANUFACTURER: 'text-green-300',
  IN_TRANSIT: 'text-cyan-300',
  PENDING_MANUFACTURER_CONFIRMATION: 'text-orange-300'
};

const DvaHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  const headers = [
    "Drug Name",
    "Manufacturer",
    "Status After Your Action",
    "Date Approved"
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/api/dva/history');
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load action history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredHistory = history.filter(batch =>
    batch.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.manufacturer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <p className="text-white p-4">Loading history...</p>;
  if (error) return <p className="text-red-300 p-4">{error}</p>;

  return (
    <div className="glass-panel p-4">
        <div className="mb-4">
            <input
                type="text"
                placeholder="Search history..."
                className="w-full glass-input px-3 py-2"
                value={searchTerm}
                onChange={handleSearchChange}
            />
        </div>
      {filteredHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/70">No processed batches found matching your search.</p>
        </div>
      ) : (
        <Table headers={headers}>
          {filteredHistory.map(batch => (
            <tr key={batch.id} className="border-b border-white/10 hover:bg-white/5">
              <td className="p-4 font-medium">{batch.drugName}</td>
              <td className="p-4 opacity-70">{batch.manufacturer.companyName}</td>
              <td className="p-4 no-wrap">
                <div className={`glass-button-sm text-xs font-bold py-1 px-3 rounded-md text-center ${STATUS_STYLES[batch.status] || 'text-white/70'}`}>
                  {batch.status.replace(/_/g, ' ')}
                </div>
              </td>
              <td className="p-4 opacity-70 no-wrap">
                {new Date(batch.dva_approved_at || batch.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};

export default DvaHistory; 