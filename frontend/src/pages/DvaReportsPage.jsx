import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ReportTable from '../components/ReportTable'; // Reusing the ReportTable component
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';

const DvaReportsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const fetchReports = async (page = 1, pageSize = 10) => {
    setLoading(true);
    setError(null);
    try {
      // Assuming an API endpoint for DVA-assigned reports
      const response = await apiClient.get('/api/dva/reports', {
        params: {
          page: page,
          pageSize: pageSize,
          // Potentially add filters for DVA-specific reports, e.g., assignedTo: user.id
        }
      });
      setReports(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to fetch DVA reports:", err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && user.role === 'DVA') {
      fetchReports();
    } else if (!user || user.role !== 'DVA') {
      navigate('/login'); // Redirect if not authorized
    }
  }, [user, token, navigate]);

  const handlePageChange = (newPage) => {
    fetchReports(newPage, pagination.pageSize);
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await apiClient.patch(`/api/reports/${reportId}`, { status: newStatus });
      // Refresh reports after successful update
      fetchReports(pagination.currentPage, pagination.pageSize);
    } catch (err) {
      console.error("Failed to update report status:", err);
      setError('Failed to update report status.');
    }
  };

  // DVA users might not assign reports, so onAssigneeChange might not be needed here
  const handleAssigneeChange = () => {}; 

  if (loading) return <div className="text-white text-center p-4">Loading reports...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-8">
        <BackButton />
        <h1 className="text-3xl sm:text-4xl font-bold text-white ml-4 drop-shadow-lg">DVA Reports</h1>
      </div>

      <div className="glass-panel p-1 sm:p-2">
        <ReportTable
          reports={reports}
          pagination={pagination}
          onPageChange={handlePageChange}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange} // Pass a no-op function or remove if not needed
        />
      </div>
    </div>
  );
};

export default DvaReportsPage;
