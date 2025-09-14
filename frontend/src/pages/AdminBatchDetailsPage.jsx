import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api';
import SealUploader from '../components/SealUploader';
import DualSealPreview from '../components/DualSealPreview';
import { FiGrid, FiPackage } from 'react-icons/fi'; // ADDED ICONS

// Your original AuditTrailItem component is preserved
function AuditTrailItem({ label, user, timestamp }) {
  if (!user && !timestamp) return null; 

  return (
    <div className="flex justify-between items-center py-3 border-b border-white/10">
      <span className="text-white/80 text-sm">{label}</span>
      <div className="text-right">
        {user && <p className="text-white font-semibold text-sm">{user.email || user.companyName}</p>}
        {timestamp && <p className="text-white/60 text-xs">{new Date(timestamp).toLocaleString()}</p>}
      </div>
    </div>
  );
}

function AdminBatchDetailsPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  
  // --- START: NEW STATE TO HOLD SEPARATED QR CODES ---
  const [masterQRs, setMasterQRs] = useState([]);
  const [childQRs, setChildQRs] = useState([]);
  // --- END: NEW STATE ---

  const fetchBatchDetails = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/admin/batches/${id}`);
      setBatch(response.data);
      // --- START: NEW LOGIC TO SPLIT THE CODES ---
      if (response.data && response.data.qrCodes) {
        setMasterQRs(response.data.qrCodes.filter(qr => qr.isMaster));
        setChildQRs(response.data.qrCodes.filter(qr => !qr.isMaster));
      }
      // --- END: NEW LOGIC ---
    } catch (err) {
      setError('Failed to load batch details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [id]);

  // Your original handleZipDownload function is fully preserved
  const handleZipDownload = async () => {
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
        link.setAttribute('download', `batch_${id}_codes.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Error generating ZIP file.');
    } finally {
        setIsZipping(false);
    }
  };

  // Your original handleUploadSuccess function is fully preserved
  const handleUploadSuccess = () => {
    fetchBatchDetails();
  };

  if (isLoading) return <p className="text-center p-8 text-white">Loading batch details...</p>;
  if (error) return <p className="text-center text-red-300 p-8">{error}</p>;
  if (!batch) return null;

  return (
    <>
      <Link to="/admin/history" className="text-white/80 hover:underline mb-6 block">← Back to History</Link>

      {/* Your original header is fully preserved */}
      <div className="glass-panel p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{batch.drugName}</h1>
          <p className="text-white/70">Batch ID: {batch.id} | Status: <span className="font-bold">{batch.status}</span></p>
        </div>
        <button onClick={handleZipDownload} disabled={isZipping || batch.qrCodes.length === 0} className="w-full sm:w-auto mt-4 sm:mt-0 font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50 disabled:cursor-not-allowed">
          {isZipping ? 'Generating ZIP...' : 'Download All as ZIP'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Your original Audit Trail panel is fully preserved */}
        <div className="lg:col-span-1 glass-panel p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Batch History & Audit Trail</h2>
          <div className="space-y-2">
            <AuditTrailItem label="Requested By" user={batch.manufacturer} timestamp={batch.createdAt} />
            <AuditTrailItem label="Approved by DVA" user={batch.dvaApprover} timestamp={batch.dva_approved_at} />
            <AuditTrailItem label="Approved by Admin" user={batch.adminApprover} timestamp={batch.admin_approved_at} />
            <AuditTrailItem label="Printing Started By" user={batch.printingStartedBy} timestamp={batch.print_started_at} />
            <AuditTrailItem label="Printing Completed By" user={batch.printingCompletedBy} timestamp={batch.print_completed_at} />
            <AuditTrailItem label="Picked Up By Logistics" user={batch.pickedUpBy} timestamp={batch.picked_up_at} />
            <AuditTrailItem label="Delivery Finalized By" user={batch.finalizedDeliveryBy} timestamp={batch.delivered_at} />
            {batch.rejector && (
              <div className="mt-4 pt-4 border-t border-red-500/30">
                 <AuditTrailItem label="Rejected By" user={batch.rejector} timestamp={null} />
                 <p className="text-red-300 text-sm mt-2">
                   <span className="font-bold">Reason:</span> {batch.rejection_reason}
                 </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Your original two-column layout is preserved, I have only changed the content of the first column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* --- START: THIS SECTION REPLACES YOUR OLD "GENERATED CODES" PANEL --- */}
          <div className="space-y-8">
            <div className="glass-panel p-6">
                <h2 className="text-xl font-bold mb-4 text-white flex items-center"><FiGrid className="mr-2"/>Master QR Codes ({masterQRs.length})</h2>
                <ul className="h-40 overflow-y-auto">
                    {masterQRs.length > 0 ? masterQRs.map(qr => (
                    <li key={qr.id} className="p-2 border-b border-white/10 font-mono text-sm text-white">{qr.outerCode}</li>
                    )) : <p className="text-white/60">No master codes.</p>}
                </ul>
            </div>
            <div className="glass-panel p-6">
                <h2 className="text-xl font-bold mb-4 text-white flex items-center"><FiPackage className="mr-2"/>Child QR Codes ({childQRs.length})</h2>
                <ul className="h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {childQRs.length > 0 ? childQRs.map(qr => (
                    <li 
                        key={qr.id} 
                        onClick={() => setSelectedCode(qr.code)}
                        className={`p-2 border-b border-white/10 font-mono text-sm cursor-pointer hover:bg-white/10 ${selectedCode === qr.code ? 'bg-blue-500/20 text-white' : 'text-white/80'}`}>
                        {qr.outerCode}
                    </li>
                    )) : <p className="text-white/60">No child codes to preview.</p>}
                </ul>
            </div>
          </div>
          {/* --- END: REPLACEMENT SECTION --- */}

          {/* --- UPDATED QR PREVIEW SECTION --- */}
          <div className="space-y-8">
            <div className="glass-panel p-6 flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold mb-4 text-white">Seal Preview</h2>
              <p className="text-sm text-white/70 text-center mb-4">Click on a Child QR Code from the list to generate a seal preview.</p>
              <DualSealPreview code={selectedCode} />
            </div>
            <div>
              {batch.seal_background_url ? (
                <div className="glass-panel p-4">
                  <h3 className="font-semibold text-white mb-2">Assigned Seal Background</h3>
                  <div className="bg-gray-800 p-2 rounded-lg">
                    <img
                      src={batch.seal_background_url}
                      alt="Seal Background Preview"
                      className="max-h-48 mx-auto rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <SealUploader batchId={id} onUploadSuccess={handleUploadSuccess} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminBatchDetailsPage;