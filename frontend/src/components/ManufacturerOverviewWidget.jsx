import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import ProductScanAnalysisWidget from './ProductScanAnalysisWidget';

const ManufacturerOverviewWidget = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    pendingBatchRequests: 0,
    activeBatches: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManufacturerData = async () => {
      if (!user || !user.id) {
        setError('User not authenticated or user ID not available.');
        setLoading(false);
        return;
      }

      try {
        const batchesRes = await apiClient.get(`/api/manufacturer/batches`);
        const allBatches = batchesRes.data;

        const activeBatches = allBatches.filter(batch => 
          batch.status === 'PRINTING_IN_PROGRESS' || 
          batch.status === 'IN_TRANSIT' ||
          batch.status === 'PENDING_MANUFACTURER_CONFIRMATION'
        );

        const pendingBatchRequests = allBatches.filter(batch =>
          batch.status === 'PENDING_DVA_APPROVAL' ||
          batch.status === 'PENDING_ADMIN_APPROVAL'
        ).length;

        setData({
          pendingBatchRequests: pendingBatchRequests,
          activeBatches: activeBatches,
          scanAnalytics: { totalScans: 0, uniqueScans: 0, recentScans: [] }, // Placeholder data
        });
      } catch (err) {
        console.error('Error fetching manufacturer data:', err);
        setError('Failed to load manufacturer data.');
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturerData();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-panel p-6 text-center text-white/70">
        Loading manufacturer overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Pending Batch Requests */}
      <div className="glass-panel p-6 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-white mb-2">Pending Batch Requests</h2>
        <div className="text-5xl font-bold text-white">{data.pendingBatchRequests}</div>
        {data.pendingBatchRequests > 0 && (
          <Link to="/manufacturer/request-batch" className="mt-4 text-blue-300 hover:text-blue-200 animate-pulse">
            View Requests
          </Link>
        )}
        {data.pendingBatchRequests === 0 && (
          <p className="mt-4 text-white/70">No pending requests.</p>
        )}
      </div>

      {/* Active Production Batches */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white mb-2">Active Production Batches</h2>
        {data.activeBatches.length > 0 ? (
          <ul className="list-disc list-inside text-left text-white/80 max-h-40 overflow-y-auto custom-scrollbar">
            {data.activeBatches.map((batch) => (
              <li key={batch.id} className="mb-1">
                Batch ID: {batch.id} - Status: {batch.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/70">No active batches in production.</p>
        )}
        <Link to="/manufacturer/batch-history" className="mt-4 block text-blue-300 hover:text-blue-200">
          View All Batches
        </Link>
      </div>

      {/* Product Scan Analytics */}
      <ProductScanAnalysisWidget />
    </div>
  );
};

export default ManufacturerOverviewWidget;
