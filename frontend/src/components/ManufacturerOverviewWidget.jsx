import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ManufacturerOverviewWidget = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    pendingBatchRequests: 0,
    activeBatches: [],
    scanAnalytics: { totalScans: 0, uniqueScans: 0, recentScans: [] },
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
        const [
          pendingBatchRequestsRes,
          activeBatchesRes,
          scanAnalyticsRes,
        ] = await Promise.all([
          apiClient.get(`/api/manufacturer/${user.id}/batch-requests/pending/count`),
          apiClient.get(`/api/manufacturer/${user.id}/batches/active`),
          apiClient.get(`/api/manufacturer/${user.id}/products/scan-analytics`),
        ]);

        setData({
          pendingBatchRequests: pendingBatchRequestsRes.data.count,
          activeBatches: activeBatchesRes.data.batches,
          scanAnalytics: scanAnalyticsRes.data,
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
        <div className="text-5xl font-bold text-yellow-400">{data.pendingBatchRequests}</div>
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
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white mb-2">Product Scan Analytics</h2>
        <p className="text-white/80">Total Scans: <span className="font-bold text-green-400">{data.scanAnalytics.totalScans}</span></p>
        <p className="text-white/80">Unique Scans: <span className="font-bold text-green-400">{data.scanAnalytics.uniqueScans}</span></p>
        {data.scanAnalytics.recentScans && data.scanAnalytics.recentScans.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Recent Scans:</h3>
            <ul className="list-disc list-inside text-left text-white/80 max-h-24 overflow-y-auto custom-scrollbar">
              {data.scanAnalytics.recentScans.map((scan, index) => (
                <li key={index} className="mb-1">
                  QR: {scan.qrCodeId} - Date: {new Date(scan.timestamp).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-white/70 mt-4 text-sm">
          (Placeholder data - actual charts/graphs would be here)
        </p>
      </div>
    </div>
  );
};

export default ManufacturerOverviewWidget;
