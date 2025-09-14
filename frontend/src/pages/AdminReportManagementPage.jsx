import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ReportTable from '../components/ReportTable'; // We will create this component next
import { useAuth } from '../context/AuthContext';

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
      const queryParams = new URLSearchParams({
        page: page,
        pageSize: pageSize,
        ...currentFilters,
      }).toString();

      const response = await fetch(`/api/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.data);
      setPagination(data.pagination);
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
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Refresh reports after successful update
      fetchReports(pagination.currentPage, pagination.pageSize, filters);
    } catch (err) {
      console.error("Failed to update report status:", err);
      setError('Failed to update report status.');
    }
  };

  const handleAssigneeChange = async (reportId, newAssigneeId) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assigneeId: newAssigneeId ? parseInt(newAssigneeId) : null }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <header className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 mr-2">
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Reports Management</h1>
      </header>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="FORWARDED">Forwarded</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div>
            <label htmlFor="reporterType" className="block text-sm font-medium text-gray-300">Reporter Type</label>
            <select
              id="reporterType"
              name="reporterType"
              value={filters.reporterType}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="USER">User (Logged In)</option>
              <option value="PUBLIC">Public (Anonymous)</option>
            </select>
          </div>
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-300">Product Name</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={filters.productName}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Filter by product name"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Start Date</label>
            <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">End Date</label>
            <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white" />
          </div>
        </div>
        <button
          onClick={applyFilters}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Apply Filters
        </button>
      </div>

      <ReportTable
        reports={reports}
        pagination={pagination}
        onPageChange={handlePageChange}
        onStatusChange={handleStatusChange}
        onAssigneeChange={handleAssigneeChange}
      />
    </div>
  );
};

export default AdminReportManagementPage;
