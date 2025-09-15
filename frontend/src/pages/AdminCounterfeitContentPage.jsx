import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import apiClient from '../api';
import Modal from '../components/Modal';

const AdminCounterfeitContentPage = () => {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null); // For edit mode
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/admin/counterfeit-content');
      setContentList(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch counterfeit content.');
      toast.error('Failed to load content.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingContent(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (content) => {
    setEditingContent(content);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await apiClient.delete(`/api/admin/counterfeit-content/${id}`);
        toast.success('Content deleted successfully!');
        fetchContent();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete content.');
      }
    }
  };

  const handleSaveContent = async (formData) => {
    try {
      if (editingContent) {
        await apiClient.put(`/api/admin/counterfeit-content/${editingContent.id}`, formData);
        toast.success('Content updated successfully!');
      } else {
        await apiClient.post('/api/admin/counterfeit-content', formData);
        toast.success('Content added successfully!');
      }
      setIsModalOpen(false);
      fetchContent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save content.');
    }
  };

  const filteredContent = contentList.filter(content => {
    const matchesProduct = filterProduct ? content.productName.toLowerCase().includes(filterProduct.toLowerCase()) : true;
    const matchesStatus = filterStatus ? content.status === filterStatus : true;
    return matchesProduct && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FiLoader size={40} className="animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 text-lg mt-8">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Counterfeit Content Management</h1>
        <button onClick={handleAddClick} className="glass-button flex items-center px-4 py-2 rounded-lg">
          <FiPlus className="mr-2" /> Add New
        </button>
      </div>

      <div className="glass-panel p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FiSearch className="text-white/70" />
          <input
            type="text"
            placeholder="Filter by Product Name"
            className="glass-input px-3 py-2 rounded-md"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-white/70" />
          <select
            className="glass-input px-3 py-2 rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white/80">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-2 px-4">Product Name</th>
                <th className="py-2 px-4">QR Code</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.length > 0 ? (filteredContent.map((content) => (
                <tr key={content.id} className="border-b border-white/10 last:border-b-0">
                  <td className="py-2 px-4">{content.productName}</td>
                  <td className="py-2 px-4">{content.qrCode}</td>
                  <td className="py-2 px-4">{content.status}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <button onClick={() => handleEditClick(content)} className="text-blue-400 hover:text-blue-300">
                      <FiEdit size={18} />
                    </button>
                    <button onClick={() => handleDeleteClick(content.id)} className="text-red-400 hover:text-red-300">
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))) : (
                <tr>
                  <td colSpan="4" className="py-4 px-4 text-center text-white/60">No counterfeit content found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingContent ? 'Edit Counterfeit Content' : 'Add Counterfeit Content'}>
        <CounterfeitContentForm content={editingContent} onSave={handleSaveContent} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

// CounterfeitContentForm component (to be defined separately)
const CounterfeitContentForm = ({ content, onSave, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  useEffect(() => {
    if (content) {
      setValue('productName', content.productName);
      setValue('qrCode', content.qrCode);
      setValue('status', content.status);
      setValue('warningText', content.warningText);
      setValue('warningVideoUrl', content.warningVideoUrl);
      // Assuming image upload is handled separately or via URL
    }
  }, [content, setValue]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-white/80 mb-1">Product Name</label>
        <input
          id="productName"
          type="text"
          {...register('productName', { required: 'Product Name is required.' })}
          className="glass-input w-full"
        />
        {errors.productName && <p className="text-red-300 text-xs mt-1">{errors.productName.message}</p>}
      </div>
      <div>
        <label htmlFor="qrCode" className="block text-sm font-medium text-white/80 mb-1">QR Code / Product ID</label>
        <input
          id="qrCode"
          type="text"
          {...register('qrCode', { required: 'QR Code/Product ID is required.' })}
          className="glass-input w-full"
        />
        {errors.qrCode && <p className="text-red-300 text-xs mt-1">{errors.qrCode.message}</p>}
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-white/80 mb-1">Status</label>
        <select
          id="status"
          {...register('status', { required: 'Status is required.' })}
          className="glass-input w-full"
        >
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {errors.status && <p className="text-red-300 text-xs mt-1">{errors.status.message}</p>}
      </div>
      <div>
        <label htmlFor="warningText" className="block text-sm font-medium text-white/80 mb-1">Warning Text</label>
        <textarea
          id="warningText"
          rows={4}
          {...register('warningText', { required: 'Warning Text is required.' })}
          className="glass-input w-full"
        />
        {errors.warningText && <p className="text-red-300 text-xs mt-1">{errors.warningText.message}</p>}
      </div>
      <div>
        <label htmlFor="warningVideoUrl" className="block text-sm font-medium text-white/80 mb-1">Warning Video URL (Optional)</label>
        <input
          id="warningVideoUrl"
          type="url"
          {...register('warningVideoUrl')}
          className="glass-input w-full"
        />
      </div>
      {/* Image upload would be more complex, potentially using a separate component or direct file upload */}
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="glass-button px-4 py-2 rounded-lg">Cancel</button>
        <button type="submit" className="glass-button px-4 py-2 rounded-lg">Save</button>
      </div>
    </form>
  );
};

export default AdminCounterfeitContentPage;