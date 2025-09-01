import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api';
import SealUploader from '../components/SealUploader';
import StyledQRCode from '../components/StyledQRCode';

// Helper component for displaying each audit trail entry
function AuditTrailItem({ label, user, timestamp }) {
  if (!user && !timestamp) return null; // Don't render if there's no data

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

  const fetchBatchDetails = async () => {
    setIsLoading(true);
    try {
      // The backend will now include all the user details we need
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

  const handleUploadSuccess = () => {
    fetchBatchDetails();
  };

  if (isLoading) return <p className="text-center p-8 text-white">Loading batch details...</p>;
  if (error) return <p className="text-center text-red-300 p-8">{error}</p>;
  if (!batch) return null;

  return (
    <>
      <Link to="/admin/history" className="text-white/80 hover:underline mb-6 block">← Back to History</Link>

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
        {/* --- START: NEW AUDIT TRAIL PANEL --- */}
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

            {/* Special case for rejections */}
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
        {/* --- END: NEW AUDIT TRAIL PANEL --- */}
        
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Generated Codes ({batch.qrCodes.length})</h2>
            {batch.qrCodes.length > 0 ? (
                <ul className="h-96 overflow-y-auto">
                    {batch.qrCodes.map(qr => (
                    <li key={qr.id} className="p-2 border-b border-white/10 flex justify-between items-center">
                        <span className="font-mono text-sm text-white">{qr.code}</span>
                        <button onClick={() => setSelectedCode(qr.code)} className="bg-white/10 text-white text-xs font-bold py-1 px-2 rounded hover:bg-white/20">
                        View
                        </button>
                    </li>
                    ))}
                </ul>
            ) : (
                <p className="text-white/70 text-center mt-16">No codes have been generated for this batch yet.</p>
            )}
          </div>

          <div className="space-y-8">
            <div className="glass-panel p-6 flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold mb-4 text-white">QR Code Preview</h2>
              {selectedCode ? <StyledQRCode code={selectedCode} /> : <p className="text-white/70">Select a code to view the QR image.</p>}
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