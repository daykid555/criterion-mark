import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides user info if needed

const ReportForm = () => {
  const { user } = useAuth(); // Get user info if needed for the report
  const [productName, setProductName] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!productName.trim()) {
      newErrors.productName = 'Product Name is required';
    }
    if (!issueDescription.trim()) {
      newErrors.issueDescription = 'Issue Description is required';
    }
    // Basic file validation (e.g., size, type)
    attachments.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        newErrors.attachments = 'File size should not exceed 5MB';
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        newErrors.attachments = 'Only JPG, PNG, and PDF files are allowed';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('qrCode', qrCode);
    formData.append('issueDescription', issueDescription);
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
    // Optionally append user ID or other user-specific data
    if (user && user.id) {
      formData.append('userId', user.id);
    }

    try {
      // Placeholder for API call
      // Replace with your actual API endpoint
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
        // When sending FormData, Content-Type header is usually set automatically by the browser
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      const result = await response.json();
      setSuccessMessage('Report submitted successfully!');
      // Clear form fields
      setProductName('');
      setQrCode('');
      setIssueDescription('');
      setAttachments([]);
      setErrors({});
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Submit a Report</h2>
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="productName"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName}</p>}
        </div>

        <div>
          <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700">
            QR Code (Optional)
          </label>
          <input
            type="text"
            id="qrCode"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700">
            Issue Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="issueDescription"
            rows="4"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            required
          ></textarea>
          {errors.issueDescription && <p className="mt-1 text-sm text-red-600">{errors.issueDescription}</p>}
        </div>

        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
            Attachments (Optional)
          </label>
          <input
            type="file"
            id="attachments"
            multiple
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
          />
          {errors.attachments && <p className="mt-1 text-sm text-red-600">{errors.attachments}</p>}
          {attachments.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Selected files: {attachments.map(file => file.name).join(', ')}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
