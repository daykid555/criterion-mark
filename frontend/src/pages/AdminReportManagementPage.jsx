import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ReportTable from '../components/ReportTable'; // We will create this component next
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';

const AdminReportManagementPage = () => {
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
  const [filters, setFilters] = useState({
    status: '',
    reporterType: '',
    assigneeId: '',
    productName: '',
    startDate: '',
    endDate: '',
  });

  const fetchReports = async (page = 1, pageSize = 10, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/reports', {
        params: {
          page: page,
          pageSize: pageSize,
          ...currentFilters,
        }
      });
      setReports(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && user.role === 'ADMIN') {
      fetchReports();
    } else if (!user || user.role !== 'ADMIN') {
      navigate('/login'); // Redirect if not authorized
    }
  }, [user, token, navigate]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = () => {
    fetchReports(1, pagination.pageSize, filters); // Reset to first page when applying filters
  };

  const handlePageChange = (newPage) => {
    fetchReports(newPage, pagination.pageSize, filters);
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await apiClient.patch(`/api/reports/${reportId}`, { status: newStatus });
      // Refresh reports after successful update
      fetchReports(pagination.currentPage, pagination.pageSize, filters);
    } catch (err) {
      console.error("Failed to update report status:", err);
      setError('Failed to update report status.');
    }
  };

  const handleAssigneeChange = async (reportId, newAssigneeId) => {
    try {
      await apiClient.patch(`/api/reports/${reportId}`, { assigneeId: newAssigneeId ? parseInt(newAssigneeId) : null });
      // Refresh reports after successful update
      fetchReports(pagination.currentPage, pagination.pageSize, filters);
    } catch (err) {
      console.error("Failed to update report assignee:", err);
      setError('Failed to update report assignee.');
    }
  };

  if (loading) return <div className="text-white text-center p-4">Loading reports...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-8">
        <BackButton />
        <h1 className="text-3xl sm:text-4xl font-bold text-white ml-4 drop-shadow-lg">Reports Management</h1>
      </div>

      <div className="glass-panel p-4 sm:p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-white/80">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full glass-input"
            >
              <option value="">All</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="FORWARDED">Forwarded</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div>
            <label htmlFor="reporterType" className="block text-sm font-medium text-white/80">Reporter Type</label>
            <select
              id="reporterType"
              name="reporterType"
              value={filters.reporterType}
              onChange={handleFilterChange}
              className="w-full glass-input"
            >
              <option value="">All</option>
              <option value="USER">User (Logged In)</option>
              <option value="PUBLIC">Public (Anonymous)</option>
            </select>
          </div>
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-white/80">Product Name</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={filters.productName}
              onChange={handleFilterChange}
              className="w-full glass-input"
              placeholder="Filter by product name"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-white/80">Start Date</label>
            <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full glass-input" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-white/80">End Date</label>
            <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full glass-input" />
          </div>
        </div>
        <button
          onClick={applyFilters}
          className="mt-4 glass-button font-bold py-2 px-4 rounded-lg"
        >
          Apply Filters
        </button>
      </div>

      <div className="glass-panel p-1 sm:p-2">
        <ReportTable
          reports={reports}
          pagination={pagination}
          onPageChange={handlePageChange}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />
      </div>
    </div>
  );
};

export default AdminReportManagementPage;
