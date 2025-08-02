import React, { useState } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
    PENDING_DVA_APPROVAL: 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30',
    PENDING_ADMIN_APPROVAL: 'bg-blue-400/20 text-blue-200 border border-blue-400/30',
    PENDING_PRINTING: 'bg-purple-400/20 text-purple-200 border border-purple-400/30',
    PRINTING_IN_PROGRESS: 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/30',
    PRINTING_COMPLETE: 'bg-teal-400/20 text-teal-200 border border-teal-400/30',
    IN_TRANSIT: 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30',
    PENDING_MANUFACTURER_CONFIRMATION: 'bg-orange-400/20 text-orange-200 border border-orange-400/30 pulse-attention',
    DELIVERED: 'bg-green-400/20 text-green-200 border border-green-400/30',
    ADMIN_REJECTED: 'bg-red-400/20 text-red-200 border border-red-400/30',
    DVA_REJECTED: 'bg-red-400/20 text-red-200 border border-red-400/30',
};

// --- MODAL FOR CONFIRMING RECEIPT ---
const ConfirmationModal = ({ batch, onClose, onRefreshData }) => {
    const [step, setStep] = useState(1); // 1: input quantity, 2: show code
    const [quantity, setQuantity] = useState(batch.quantity);
    const [code, setCode] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const response = await apiClient.post(`/api/manufacturer/batches/${batch.id}/confirm-receipt`, {
                received_quantity: quantity,
            });
            setCode(response.data.confirmationCode);
            setStep(2);
            onRefreshData(); // Refresh the parent component's data
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to confirm receipt.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="glass-panel p-8 rounded-lg max-w-md w-full text-white">
                {step === 1 ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Confirm Receipt for Batch #{batch.id}</h2>
                        <p className="text-white/70 mb-2">Please verify the quantity of seals you received for '{batch.drugName}'.</p>
                        <p className="text-white/70 mb-6 text-sm">Expected quantity: {batch.quantity.toLocaleString()}</p>
                        
                        <label htmlFor="quantity" className="block text-sm font-medium text-white/80 mb-2">Actual Quantity Received:</label>
                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full bg-black/30 text-white text-center text-2xl p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                        <div className="flex gap-4">
                            <button onClick={onClose} disabled={isSubmitting} className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSubmitting || !quantity} className="w-full py-3 rounded-lg glass-button disabled:opacity-50">
                                {isSubmitting ? 'Confirming...' : 'Confirm & Generate Code'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-green-400">Confirmation Code Generated!</h2>
                        <p className="text-white/70 mb-6">Provide this code to the logistics driver to finalize the delivery. This code is for one-time use.</p>
                        <div className="bg-black/40 text-center p-6 rounded-lg mb-6">
                            <p className="text-5xl font-mono tracking-widest text-cyan-300">{code}</p>
                        </div>
                        <button onClick={onClose} className="w-full py-3 rounded-lg glass-button">Done</button>
                    </>
                )}
            </div>
        </div>
    );
};

function BatchHistoryTable({ batches, onRefreshData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const handleConfirmClick = (batch) => {
    setSelectedBatch(batch);
    setModalOpen(true);
  };
  
  if (!batches || batches.length === 0) {
    return <p className="text-center text-white/70 mt-8">You have not requested any batches yet.</p>;
  }

  return (
    <>
        {modalOpen && <ConfirmationModal batch={selectedBatch} onClose={() => setModalOpen(false)} onRefreshData={onRefreshData} />}
        <div className="w-full mt-4 text-white">
          <h2 className="text-2xl font-bold mb-6">Batch History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-4 text-sm font-semibold opacity-80">Batch ID</th>
                  <th className="p-4 text-sm font-semibold opacity-80">Drug Name</th>
                  <th className="p-4 text-sm font-semibold opacity-80">Quantity</th>
                  <th className="p-4 text-sm font-semibold opacity-80">Status</th>
                  <th className="p-4 text-sm font-semibold opacity-80 text-center">Seal Design</th>
                  <th className="p-4 text-sm font-semibold opacity-80">Notes</th>
                  <th className="p-4 text-sm font-semibold opacity-80 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-white/10">
                    <td className="p-4">#{batch.id}</td>
                    <td className="p-4 font-medium">{batch.drugName}</td>
                    <td className="p-4">{batch.quantity.toLocaleString()}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[batch.status] || 'bg-gray-400/20 text-gray-200'}`}>
                        {batch.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {batch.seal_background_url ? (
                        <img 
                          src={batch.seal_background_url}
                          alt="Seal Preview"
                          className="h-10 w-auto object-contain mx-auto rounded-sm bg-white/10 p-1"
                        />
                      ) : (
                        <span className="text-xs text-white/50 italic">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-red-300 text-sm">
                      {batch.status.includes('REJECTED') && batch.rejection_reason ? (
                        <span className="italic">{batch.rejection_reason}</span>
                      ) : (
                        <span className="text-white/50">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                        {batch.status === 'PENDING_MANUFACTURER_CONFIRMATION' ? (
                            <button onClick={() => handleConfirmClick(batch)} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-orange-500/30">
                                Confirm Receipt
                            </button>
                        ) : (
                             <span className="text-xs text-white/50 italic">No action</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
}

export default BatchHistoryTable;