// frontend/src/pages/PrintingBatchPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api';

function PrintingBatchPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        // --- FIX [1]: Corrected the API endpoint from /api/admin/batches/:id to the authorized /api/printing/batches/:id ---
        const response = await apiClient.get(`/api/printing/batches/${id}`);
        setBatch(response.data);
      } catch (err) {
        setError('Failed to load batch details. You may not have permission to view this.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatch();
  }, [id]);
  
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const response = await apiClient({
        method: 'post',
        url: `/api/printing/batch/${id}/zip`,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_${id}_seals.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the object URL

    } catch (err) {
        alert('Error generating ZIP file. Ensure a seal background has been uploaded by an admin.');
    } finally {
        setIsZipping(false);
    }
  };

  if (isLoading) return <p className="text-white/70 text-center">Loading batch...</p>;
  if (error) return <p className="text-red-400 text-center">{error}</p>;
  if (!batch) return <p className="text-white/70 text-center">No batch data found.</p>;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // Ensure qrCodes exists and has items before accessing
  const firstCode = batch.qrCodes && batch.qrCodes[0] ? batch.qrCodes[0].code : null;

  return (
    <div>
      <Link to="/printing/dashboard" className="text-white/80 hover:underline mb-6 block">← Back to Printing Queue</Link>

      <div className="glass-panel p-6 mb-8">
        <h1 className="text-3xl font-bold text-white">{batch.drugName}</h1>
        <p className="text-white/70">Batch ID: {id} | Seals to generate: {batch.qrCodes ? batch.qrCodes.length : 0}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview Section */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4 text-white">Final Seal Preview</h2>
          {firstCode ? (
            <img 
              src={`${API_BASE_URL}/api/printing/seal/${firstCode}`}
              alt="Seal Preview"
              className="rounded-lg shadow-lg max-w-xs w-full"
            />
          ) : (
            <p className="text-white/70">No QR codes found for this batch.</p>
          )}
        </div>
        
        {/* Download Section */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold mb-4 text-white">Download All Seals</h2>
            <p className="text-white/70 mb-6">This will generate a ZIP archive containing all {batch.qrCodes ? batch.qrCodes.length : 0} unique seal images for this batch.</p>
            <button
                onClick={handleDownloadZip}
                disabled={isZipping || !batch.qrCodes || batch.qrCodes.length === 0}
                className="w-full max-w-xs font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50"
            >
                {isZipping ? `Generating... (may take a moment)` : `Download ZIP`}
            </button>
        </div>
      </div>
    </div>
  );
}

export default PrintingBatchPage;