// frontend/src/components/BatchHistoryTable.jsx
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

// --- MODAL TO DISPLAY THE GENERATED CONFIRMATION CODE ---
const ConfirmationCodeDisplayModal = ({ batch, onClose }) => {
    const confirmationCode = batch?.delivery_confirmation_code; // Get the code from the batch prop

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="glass-panel p-8 rounded-lg max-w-md w-full text-white">
                <h2 className="text-2xl font-bold mb-4 text-green-400">Confirmation Code Generated!</h2>
                <p className="text-white/70 mb-6">Provide this code to the logistics driver to finalize the delivery. This code is for one-time use.</p>
                <div className="bg-black/40 text-center p-6 rounded-lg mb-6">
                    {confirmationCode ? (
                        <p className="text-5xl font-mono tracking-widest text-cyan-300">{confirmationCode}</p>
                    ) : (
                        <p className="text-white/50 italic">Code not yet generated or available.</p>
                    )}
                </div>
                <button onClick={onClose} className="w-full py-3 rounded-lg glass-button">Done</button>
            </div>
        </div>
    );
};

function BatchHistoryTable({ batches, onRefreshData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null); // Stores the batch with the code

  // --- NEW FUNCTION: Trigger code generation and then display it ---
  const handleGenerateConfirmationCode = async (batch) => {
    try {
        // Call the backend endpoint to generate the confirmation code
        const response = await apiClient.put(`/api/manufacturer/batches/${batch.id}/confirm-delivery`);
        // The response from this endpoint contains the generated code in `response.data.confirmationCode`
        setSelectedBatch({ ...batch, delivery_confirmation_code: response.data.confirmationCode }); // Update local state with the code
        setModalOpen(true);
        onRefreshData(); // Refresh the list to potentially update the status if needed
    } catch (error) {
        console.error("Failed to generate confirmation code:", error);
        alert('Error generating confirmation code. Please try again.');
    }
  };

  if (!batches || batches.length === 0) {
    return <p className="text-center text-white/70 mt-8">You have not requested any batches yet.</p>;
  }

  return (
    <>
        {/* --- Using the new modal to display the code --- */}
        {modalOpen && selectedBatch && (
            <ConfirmationCodeDisplayModal batch={selectedBatch} onClose={() => setModalOpen(false)} />
        )}
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
                        {/* --- ACTION BUTTON LOGIC CORRECTED --- */}
                        {batch.status === 'PENDING_MANUFACTURER_CONFIRMATION' ? (
                            <button onClick={() => handleGenerateConfirmationCode(batch)} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-orange-500/30">
                                Generate Code
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