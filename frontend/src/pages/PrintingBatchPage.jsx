// frontend/src/pages/PrintingBatchPage.jsx - THE FINAL, ARCHITECTURALLY CORRECT FIX

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api';

function PrintingBatchPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  
  // --- FIX: State to hold the secure, local URL for the preview image ---
  const [sealPreviewUrl, setSealPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBatchDetails = async () => {
      try {
        const response = await apiClient.get(`/api/printing/batches/${id}`);
        if (isMounted) {
          setBatch(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load batch details. The batch may not exist or you may not have permission.');
        }
        console.error("Error fetching batch details:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBatchDetails();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [id]);

  // --- FIX: This useEffect fetches the authenticated image AFTER the batch data is loaded ---
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const fetchSealPreview = async () => {
      if (batch && batch.qrCodes && batch.qrCodes.length > 0) {
        const firstCode = batch.qrCodes[0].code;
        setIsPreviewLoading(true);
        try {
          // Fetch the image as a 'blob' using our authenticated apiClient
          const response = await apiClient.get(`/api/printing/seal/${firstCode}`, {
            responseType: 'blob',
          });
          
          // Create a temporary local URL from the blob data
          objectUrl = URL.createObjectURL(response.data);
          
          if (isMounted) {
            setSealPreviewUrl(objectUrl);
          }
        } catch (err) {
          console.error("Failed to fetch seal preview:", err);
          if (isMounted) {
             setError(prev => `${prev}\nFailed to load seal preview. The background may not be set.`);
          }
        } finally {
          if (isMounted) {
            setIsPreviewLoading(false);
          }
        }
      }
    };

    fetchSealPreview();

    // Cleanup function: Revoke the object URL to prevent memory leaks when the component unmounts
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [batch]); // This effect runs whenever the 'batch' state changes

  
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
      window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Error generating ZIP file. Ensure a seal background has been uploaded by an admin.');
    } finally {
        setIsZipping(false);
    }
  };

  if (isLoading) return <p className="text-white/70 text-center">Loading batch...</p>;
  if (error && !batch) return <p className="text-red-400 text-center whitespace-pre-wrap">{error}</p>;
  if (!batch) return null;

  return (
    <div>
      <Link to="/printing/dashboard" className="text-white/80 hover:underline mb-6 block">← Back to Printing Queue</Link>
      <div className="glass-panel p-6 mb-8">
        <h1 className="text-3xl font-bold text-white">{batch.drugName}</h1>
        <p className="text-white/70">Batch ID: {id} | Seals to generate: {batch.qrCodes.length}</p>
        {error && <p className="text-red-400 text-sm mt-2 whitespace-pre-wrap">{error}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview Section */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4 text-white">Final Seal Preview</h2>
          {isPreviewLoading ? (
             <p className="text-white/70">Loading preview...</p>
          ) : sealPreviewUrl ? (
            // The img src is now the secure, local blob URL
            <img 
              src={sealPreviewUrl}
              alt="Seal Preview"
              className="rounded-lg shadow-lg max-w-xs w-full"
            />
          ) : (
            <p className="text-white/70">Could not load seal preview. Ensure a background is set by an Admin.</p>
          )}
        </div>
        
        {/* Download Section */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold mb-4 text-white">Download All Seals</h2>
            <p className="text-white/70 mb-6">This will generate a ZIP archive containing all {batch.qrCodes.length} unique seal images for this batch.</p>
            <button
                onClick={handleDownloadZip}
                disabled={isZipping || batch.qrCodes.length === 0}
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