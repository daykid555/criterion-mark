// frontend/src/pages/CreateHealthVideoPage.jsx

import React, { useEffect } from 'react';
import apiClient from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSave, FiArrowLeft, FiLoader } from 'react-icons/fi';

function CreateHealthVideoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingItem = location.state?.pendingItem; // Get the item passed from the dashboard

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm();

  // Pre-fill the form if a pending item was passed
  useEffect(() => {
    if (pendingItem) {
      setValue('drugName', pendingItem.drugName);
      setValue('nafdacNumber', pendingItem.nafdacNumber);
    }
  }, [pendingItem, setValue]);

  const onSubmit = async (data) => {
    const toastId = toast.loading('Submitting content entry...');
    try {
      // Only send genuine content fields
      const payload = {
        drugName: data.drugName,
        nafdacNumber: data.nafdacNumber,
        genuineText: data.genuineText,
        genuineVideoUrl: data.genuineVideoUrl,
      };
      await apiClient.post('/api/health-advisor/videos', payload);
      toast.success('Content entry created successfully!', { id: toastId });
      navigate('/health-advisor/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="glass-button p-3 rounded-lg">
          <FiArrowLeft />
        </button>
        <h1 className="text-3xl font-bold text-white">Add New Health Content</h1>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="drugName" className="block text-sm font-medium text-white/80 mb-1">Drug Name</label>
              <input
                id="drugName"
                type="text"
                {...register('drugName', { required: 'Drug Name is required.' })}
                className={`glass-input w-full ${errors.drugName ? 'border-red-500' : ''}`}
                placeholder="e.g., Paracetamol 500mg"
                readOnly={!!pendingItem} // Make field read-only if pre-filled
              />
              {errors.drugName && <p className="text-red-300 text-xs mt-1">{errors.drugName.message}</p>}
            </div>
            <div>
              <label htmlFor="nafdacNumber" className="block text-sm font-medium text-white/80 mb-1">NAFDAC Number</label>
              <input
                id="nafdacNumber"
                type="text"
                {...register('nafdacNumber', { required: 'NAFDAC Number is required.' })}
                className={`glass-input w-full ${errors.nafdacNumber ? 'border-red-500' : ''}`}
                placeholder="e.g., A4-1234"
                readOnly={!!pendingItem} // Make field read-only if pre-filled
              />
              {errors.nafdacNumber && <p className="text-red-300 text-xs mt-1">{errors.nafdacNumber.message}</p>}
            </div>
          </div>
          
          <hr className="border-white/10" />

          {/* Genuine Content Section */}
          <div className="space-y-4 rounded-lg bg-green-500/5 p-4">
            <h3 className="font-bold text-green-300">Content for Genuine Products</h3>
             <div>
              <label htmlFor="genuineText" className="block text-sm font-medium text-white/80 mb-1">Instructional Text</label>
              <textarea
                id="genuineText"
                rows={3}
                {...register('genuineText', { required: 'Text for genuine products is required.' })}
                className={`glass-input w-full ${errors.genuineText ? 'border-red-500' : ''}`}
                placeholder="This text is shown first. Example: ✅ Genuine Product. Take two tablets every 6 hours."
              />
              {errors.genuineText && <p className="text-red-300 text-xs mt-1">{errors.genuineText.message}</p>}
            </div>
            <div>
              <label htmlFor="genuineVideoUrl" className="block text-sm font-medium text-white/80 mb-1">Instructional Video URL</label>
              <input
                id="genuineVideoUrl"
                type="url"
                {...register('genuineVideoUrl', { required: 'URL for genuine product video is required.' })}
                className={`glass-input w-full ${errors.genuineVideoUrl ? 'border-red-500' : ''}`}
                placeholder="https://youtube.com/watch?v=genuine-video"
              />
              {errors.genuineVideoUrl && <p className="text-red-300 text-xs mt-1">{errors.genuineVideoUrl.message}</p>}
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="font-bold py-3 px-8 rounded-lg glass-button flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <PillLoader text="Saving..." />
              ) : (
                <>
                  <FiSave className="mr-2" />
                  <span>Save Content</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateHealthVideoPage;
