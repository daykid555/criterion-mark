import React, { useState, useEffect, useContext } from 'react';
import apiClient from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import DvaVerificationThroughputWidget from './DvaVerificationThroughputWidget';

const DvaOverviewWidget = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    pendingVerifications: 0,
    reportsForReview: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDvaData = async () => {
      if (!user || !user.id) {
        setError('User not authenticated or user ID not available.');
        setLoading(false);
        return;
      }

      try {
        const pendingBatchesRes = await apiClient.get(`/api/dva/pending-batches`);
        const pendingBatches = pendingBatchesRes.data;

        setData({
          pendingVerifications: pendingBatches.length,
          reportsForReview: [], // Placeholder data
          verificationThroughput: { today: 0, week: 0 }, // Placeholder data
        });
      } catch (err) {
        console.error('Error fetching DVA data:', err);
        setError('Failed to load DVA data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDvaData();
  }, [user]);

  if (loading) {
    return (
      <div className="glass-panel p-6 text-center text-white/70">
        Loading DVA overview...
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
      {/* Pending Verification Queue */}
      <div className="glass-panel p-6 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-white mb-2">Pending Verifications</h2>
        <div className="text-5xl font-bold text-white">{data.pendingVerifications}</div>
        {data.pendingVerifications > 0 && (
          <Link to="/dva/approval-queue" className="mt-4 text-blue-300 hover:text-blue-200 animate-pulse">
            View Queue
          </Link>
        )}
        {data.pendingVerifications === 0 && (
          <p className="mt-4 text-white/70">No pending verifications.</p>
        )}
      </div>

      {/* Reports for DVA Review */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white mb-2">Reports for Review</h2>
        {data.reportsForReview.length > 0 ? (
          <ul className="list-disc list-inside text-left text-white/80 max-h-40 overflow-y-auto custom-scrollbar">
            {data.reportsForReview.map((report) => (
              <li key={report.id} className="mb-1">
                Report ID: {report.id} - Status: {report.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-white/70">No reports currently assigned for review.</p>
        )}
        <Link to="/dva/reports" className="mt-4 block text-blue-300 hover:text-blue-200">
          View All Reports
        </Link>
      </div>

      {/* Verification Throughput */}
      <DvaVerificationThroughputWidget />
    </div>
  );
};

export default DvaOverviewWidget;
