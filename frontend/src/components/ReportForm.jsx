import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';
import toast from 'react-hot-toast';

const ReportForm = () => {
  const { user } = useAuth();
  const [productName, setProductName] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!productName.trim()) newErrors.productName = 'Product Name is required';
    if (!issueDescription.trim()) newErrors.issueDescription = 'Issue Description is required';
    if (attachments.length > 5) newErrors.attachments = 'You can upload a maximum of 5 files.';
    attachments.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        newErrors.attachments = 'File size should not exceed 5MB.';
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
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Submitting report...');
    
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('qrCode', qrCode);
    formData.append('issueDescription', issueDescription);
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const response = await apiClient.post('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(response.data.message || 'Report submitted successfully!', { id: toastId });
      
      // Clear form
      setProductName('');
      setQrCode('');
      setIssueDescription('');
      setAttachments([]);
      document.getElementById('attachments').value = '';
      setErrors({});

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-white/80 mb-1">
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="productName"
            className="w-full glass-input px-3 py-3 text-lg"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          {errors.productName && <p className="mt-2 text-sm text-red-400">{errors.productName}</p>}
        </div>

        <div>
          <label htmlFor="qrCode" className="block text-sm font-medium text-white/80 mb-1">
            QR Code / Serial Number (Optional)
          </label>
          <input
            type="text"
            id="qrCode"
            className="w-full glass-input px-3 py-3 text-lg"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="issueDescription" className="block text-sm font-medium text-white/80 mb-1">
            Detailed Description of the Issue <span className="text-red-400">*</span>
          </label>
          <textarea
            id="issueDescription"
            rows="5"
            className="w-full glass-input px-3 py-3 text-lg"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
          ></textarea>
          {errors.issueDescription && <p className="mt-2 text-sm text-red-400">{errors.issueDescription}</p>}
        </div>

        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-white/80 mb-2">
            Attach Images or Documents (Optional, up to 5 files)
          </label>
          <input
            type="file"
            id="attachments"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors cursor-pointer"
            accept=".jpg,.jpeg,.png,.pdf"
          />
          {errors.attachments && <p className="mt-2 text-sm text-red-400">{errors.attachments}</p>}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full glass-button font-bold py-3 px-4 rounded-lg disabled:opacity-50"
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