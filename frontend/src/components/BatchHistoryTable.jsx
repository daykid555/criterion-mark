// frontend/src/components/BatchHistoryTable.jsx
import React, { useState } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
    PENDING_DVA_APPROVAL: 'text-yellow-300',
    PENDING_ADMIN_APPROVAL: 'text-blue-300',
    PENDING_PRINTING: 'text-purple-300',
    PRINTING_IN_PROGRESS: 'text-indigo-300 animate-pulse',
    PRINTING_COMPLETE: 'text-teal-300',
    IN_TRANSIT: 'text-cyan-300',
    PENDING_MANUFACTURER_CONFIRMATION: 'text-orange-300 pulse-attention',
    DELIVERED_TO_MANUFACTURER: 'text-green-300',
    ADMIN_REJECTED: 'text-red-300',
    DVA_REJECTED: 'text-red-300',
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
        import Table from './Table'; // Import the new Table component

const STATUS_STYLES = {
    PENDING_DVA_APPROVAL: 'text-yellow-300',
    PENDING_ADMIN_APPROVAL: 'text-blue-300',
    PENDING_PRINTING: 'text-purple-300',
    PRINTING_IN_PROGRESS: 'text-indigo-300 animate-pulse',
    PRINTING_COMPLETE: 'text-teal-300',
    IN_TRANSIT: 'text-cyan-300',
    PENDING_MANUFACTURER_CONFIRMATION: 'text-orange-300 pulse-attention',
    DELIVERED_TO_MANUFACTURER: 'text-green-300',
    ADMIN_REJECTED: 'text-red-300',
    DVA_REJECTED: 'text-red-300',
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

  const headers = [
    "Batch ID",
    "Drug Name",
    "Quantity",
    "Status",
    "Seal Design",
    "Notes",
    "Action"
  ];

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
          <Table headers={headers}>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-4">#{batch.id}</td>
                <td className="p-4 font-medium">{batch.drugName}</td>
                <td className="p-4">{batch.quantity.toLocaleString()}</td>
                <td className="p-4 whitespace-nowrap">
                  <div className={`glass-button-sm text-xs font-bold py-1 px-3 rounded-md text-center ${STATUS_STYLES[batch.status] || 'text-white/70'}`}>
                    {batch.status.replace(/_/g, ' ')}
                  </div>
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
          </Table>
        </div>
    </>
  );
}
export default BatchHistoryTable;
    </>
  );
}
export default BatchHistoryTable;