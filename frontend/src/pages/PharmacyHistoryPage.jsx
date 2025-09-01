import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { FiLoader } from 'react-icons/fi';

function PharmacyHistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/api/pharmacy/dispense-history');
        setHistory(response.data);
      } catch (err) {
        setError('Failed to load dispense history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FiLoader className="animate-spin text-white text-4xl" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-300 p-8">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dispense History</h1>
      <p className="text-white/70">A log of all products you have dispensed.</p>
      
      <div className="glass-panel p-1">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-white/90">
            <thead className="bg-white/10 text-xs uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">Drug Name</th>
                <th scope="col" className="px-6 py-3">Manufacturer</th>
                <th scope="col" className="px-6 py-3">Product Code (Outer)</th>
                <th scope="col" className="px-6 py-3">Dispensed On</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4 font-bold">{record.qrCode?.batch?.drugName || 'N/A'}</td>
                    <td className="px-6 py-4">{record.qrCode?.batch?.manufacturer?.companyName || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{record.qrCode?.outerCode || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(record.dispensedAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-white/70">You have not dispensed any products yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PharmacyHistoryPage;