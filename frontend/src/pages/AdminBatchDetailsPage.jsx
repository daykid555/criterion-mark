// frontend/src/pages/AdminBatchDetailsPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StyledQRCode from '../components/StyledQRCode';
import apiClient from '../api';
import SealUploader from '../components/SealUploader'; // <-- NEW: Import the uploader component

function AdminBatchDetailsPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  const fetchBatchDetails = async () => {
    setIsLoading(true); // Ensure loading state is true on refetch
    try {
      const response = await apiClient.get(`/api/admin/batches/${id}`);
      setBatch(response.data);
    } catch (err) {
      setError('Failed to load batch details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [id]);
  
  const handleZipDownload = async () => {
    // ... (This function remains unchanged)
    setIsZipping(true);
    try {
      const response = await apiClient({
        method: 'post',
        url: `/api/admin/batches/${id}/codes/zip`,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `batch_${id}_${batch.drugName.replace(/\s+/g, '_')}_qrcodes.zip`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download zip file:', err);
      alert('Error: Could not generate the ZIP file.');
    } finally {
      setIsZipping(false);
    }
  };
  
  // --- NEW: A function to be called when the upload is successful ---
  const handleUploadSuccess = () => {
    // Refetch the batch details to get the new seal_background_url
    fetchBatchDetails();
  };

  if (isLoading) return <p className="text-center p-8 text-white">Loading batch details...</p>;
  if (error) return <p className="text-center text-red-300 p-8">{error}</p>;
  if (!batch) return <p className="text-center p-8 text-white">No batch data found.</p>;


  return (
    <>
      <Link to="/admin/dashboard" className="text-white/80 hover:underline mb-6 block">← Back to Dashboard</Link>
      
      <div className="glass-panel p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{batch.drugName}</h1>
          <p className="text-white/70">Batch ID: {batch.id} | Codes: {batch.qrCodes.length}</p>
        </div>
        <button
          onClick={handleZipDownload}
          disabled={isZipping}
          className="w-full sm:w-auto mt-4 sm:mt-0 font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50"
        >
          {isZipping ? 'Generating ZIP...' : 'Download All as ZIP'}
        </button>
      </div>

      {/* --- NEW: Conditional Section for Seal Management --- */}
      <div className="mb-8">
        {batch.seal_background_url ? (
          // If a seal IS uploaded, show a preview
          <div className="glass-panel p-4">
            <h3 className="font-semibold text-white mb-2">Assigned Seal Background</h3>
            <div className="bg-gray-800 p-2 rounded-lg">
              <img 
                // We construct the full URL using the API base and the stored path
                src={`${import.meta.env.VITE_API_BASE_URL}${batch.seal_background_url}`} 
                alt="Seal Background Preview"
                className="max-h-48 mx-auto rounded-md"
              />
            </div>
          </div>
        ) : (
          // If a seal is NOT uploaded, show the uploader component
          <SealUploader batchId={id} onUploadSuccess={handleUploadSuccess} />
        )}
      </div>
      {/* --- End of New Section --- */}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Generated Codes</h2>
          <ul className="h-96 overflow-y-auto">
            {batch.qrCodes.map(qr => (
              <li key={qr.id} className="p-2 border-b border-white/10 flex justify-between items-center">
                <span className="font-mono text-sm text-white">{qr.code}</span>
                <button
                  onClick={() => setSelectedCode(qr.code)}
                  className="bg-white/10 text-white text-xs font-bold py-1 px-2 rounded hover:bg-white/20"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold mb-4 text-white">QR Code Preview</h2>
          {selectedCode ? (
            <StyledQRCode code={selectedCode} />
          ) : (
            <p className="text-white/70">Select a code to view the QR image.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminBatchDetailsPage;