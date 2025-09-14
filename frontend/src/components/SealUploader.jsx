// frontend/src/components/SealUploader.jsx

import React, { useState } from 'react';
import apiClient from '../api';

function SealUploader({ batchId, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError('');
    setMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('sealBackground', selectedFile);

    try {
      const response = await apiClient.post(`/api/admin/batches/${batchId}/upload-seal`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message);
      onUploadSuccess(response.data.fileUrl); // Notify parent component of success
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="font-semibold text-white">Upload Seal Background</h3>
      <p className="text-xs text-white/60">Upload the *.png or *.jpeg design for this batch. The QR code will be placed on top of this image.</p>
      
      <input 
        type="file" 
        onChange={handleFileChange}
        className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
      />

      <button 
        onClick={handleUpload} 
        disabled={isUploading || !selectedFile}
        className="w-full glass-button py-2 rounded-lg font-bold disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload & Assign'}
      </button>
      
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      {message && <p className="text-green-300 text-xs text-center">{message}</p>}
    </div>
  );
}

export default SealUploader;