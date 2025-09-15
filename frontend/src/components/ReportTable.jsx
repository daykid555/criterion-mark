import React, { useState } from 'react';
import { FiEye, FiEdit, FiChevronLeft, FiChevronRight, FiSend } from 'react-icons/fi';
import Modal from './Modal';
import apiClient from '../api'; // Import apiClient
import toast from 'react-hot-toast'; // Import toast for notifications

const ReportTable = ({ reports, pagination, onPageChange, onStatusChange, onAssigneeChange, fetchReports }) => { // Added fetchReports
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const openModal = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setNewAssigneeId(report.assigneeId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setNewStatus('');
    setNewAssigneeId('');
  };

  const handleStatusUpdate = () => {
    if (selectedReport && newStatus) {
      onStatusChange(selectedReport.id, newStatus);
      closeModal();
    }
  };

  const handleAssigneeUpdate = () => {
    if (selectedReport) {
      onAssigneeChange(selectedReport.id, newAssigneeId);
      closeModal();
    }
  };

  // New function to handle forwarding
  const handleForward = async (reportId, target) => {
    const toastId = toast.loading(`Forwarding report to ${target}...`);
    try {
      await apiClient.post(`/api/reports/${reportId}/forward`, { target });
      toast.success(`Report forwarded to ${target} successfully!`, { id: toastId });
      fetchReports(); // Re-fetch reports to update the list
    } catch (error) {
      console.error(`Failed to forward report to ${target}:`, error);
      toast.error(`Failed to forward report to ${target}.`, { id: toastId });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Report ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reporter Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Product</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {reports.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400">
                  No reports found.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{report.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {report.user ? 'User' : 'Public'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{report.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{report.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                    <button
                      onClick={() => openModal(report)}
                      className="text-indigo-400 hover:text-indigo-600"
                      title="View Details"
                    >
                      <FiEye size={18} />
                    </button>
                    {report.status !== 'FORWARDED' && report.status !== 'RESOLVED' && report.status !== 'FORWARDED_TO_STORE' && (
                      <button
                        onClick={() => handleForward(report.id, 'dva')} // Call new handleForward function
                        className="text-yellow-400 hover:text-yellow-600"
                        title="Forward to DVA"
                      >
                        <FiSend size={18} />
                      </button>
                    )}
                    {report.status !== 'FORWARDED_TO_STORE' && report.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleForward(report.id, 'store')} // Call new handleForward function
                        className="text-blue-400 hover:text-blue-600"
                        title="Forward to Store"
                      >
                        <FiSend size={18} />
                      </button>
                    )}
                    {report.status !== 'RESOLVED' && (
                      <button
                        onClick={() => onStatusChange(report.id, 'RESOLVED')}
                        className="text-green-400 hover:text-green-600"
                        title="Resolve Report"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <nav
        className="bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-700 sm:px-6"
        aria-label="Pagination"
      >
        <div className="hidden sm:block">
          <p className="text-sm text-gray-300">
            Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{' '}
            <span className="font-medium">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)}</span> of{' '}
            <span className="font-medium">{pagination.totalCount}</span> results
          </p>
        </div>
        <div className="flex-1 flex justify-between sm:justify-end">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.currentPage || pagination.currentPage <= 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="h-5 w-5" />
            Previous
          </button>
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.currentPage || pagination.currentPage >= pagination.totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Report Details Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Report Details">
        {selectedReport && (
          <div className="text-gray-200">
            <p><strong>Product Name:</strong> {selectedReport.productName}</p>
            <p><strong>QR Code:</strong> {selectedReport.qrCode || 'N/A'}</p>
            <p><strong>Description:</strong> {selectedReport.issueDescription}</p>
            <p><strong>Reporter:</strong> {selectedReport.user ? selectedReport.user.email : 'Public'}</p>
            <p><strong>Status:</strong> {selectedReport.status}</p>
            <p><strong>Assigned To:</strong> {selectedReport.assignee ? selectedReport.assignee.email : 'Unassigned'}</p>
            <p><strong>Date Created:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
            {selectedReport.attachments && selectedReport.attachments.length > 0 && (
              <div className="mt-4">
                <strong>Attachments:</strong>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedReport.attachments.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate">
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Update Report</h3>
              <div className="mb-4">
                <label htmlFor="newStatus" className="block text-sm font-medium text-gray-300">Change Status</label>
                <select
                  id="newStatus"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="NEW">New</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="FORWARDED">Forwarded</option>
                  <option value="FORWARDED_TO_STORE">Forwarded to Store</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update Status
                </button>
              </div>

              {/* Assignee selection - You'd typically fetch a list of assignable users here */}
              <div className="mb-4">
                <label htmlFor="newAssignee" className="block text-sm font-medium text-gray-300">Assign To</label>
                <select
                  id="newAssignee"
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Unassign</option>
                  {/* Placeholder for actual users. In a real app, fetch users with roles like ADMIN, DVA, etc. */}
                  <option value="1">Admin User (ID: 1)</option>
                  {/* Add more options dynamically based on fetched users */}
                </select>
                <button
                  onClick={handleAssigneeUpdate}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportTable;
