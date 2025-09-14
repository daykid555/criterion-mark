// frontend/src/pages/LogisticsActiveShipmentsPage.jsx - REVERTED
import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const STATUS_STYLES = {
  PRINTING_COMPLETE: 'bg-green-200 text-green-800 pulse-attention-soft',
  IN_TRANSIT: 'bg-cyan-200 text-cyan-800 animate-pulse',
  PENDING_MANUFACTURER_CONFIRMATION: 'bg-orange-200 text-orange-800 animate-pulse',
};

// --- MODAL FOR FINALIZING DELIVERY (Defined outside the main component) ---
const FinalizeModal = ({ batch, onClose, onSubmit, isSubmitting, error }) => {
    const [code, setCode] = useState('');
    if (!batch) return null; // Safety check

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="glass-panel p-8 rounded-lg max-w-md w-full text-white">
                <h2 className="text-2xl font-bold mb-4">Finalize Delivery for Batch #{batch.id}</h2>
                <p className="text-white/70 mb-6">Enter the 6-digit confirmation code provided by the manufacturer to complete this delivery.</p>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(batch.id, code); }}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g., 123456"
                        maxLength="6"
                        className="w-full bg-black/30 text-white text-center text-2xl font-mono tracking-widest p-4 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                     {error && <p className="text-red-400 text-center mb-4 text-sm">{error}</p>}
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting || code.length !== 6} className="w-full py-3 rounded-lg glass-button disabled:opacity-50">
                            {isSubmitting ? 'Finalizing...' : 'Finalize'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- DYNAMIC JOBS TABLE (Defined outside the main component) ---
const LogisticsJobsTable = ({ jobs, handleAction, title }) => {
    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 px-2">{title}</h2>
            {jobs.length === 0 ? <p className="text-center py-6 text-white/70 border-t border-white/10">No batches in this queue.</p> :
            <div className="overflow-x-auto">
                <table className="w-full text-left text-white min-w-[800px]">
                    <thead className="border-b border-white/20 text-sm text-white/70"><tr><th className="p-4">Batch ID</th><th className="p-4">Product</th><th className="p-4">Manufacturer</th><th className="p-4">Quantity</th><th className="p-4">Status</th><th className="p-4 text-center">Action</th></tr></thead>
                    <tbody className="divide-y divide-white/10">
                        {jobs.map(job => (
                            <tr key={job.id}>
                                <td className="p-4 font-mono">#{job.id}</td><td className="p-4 font-semibold">{job.drugName}</td><td className="p-4">{job.manufacturer.companyName}</td><td className="p-4">{job.quantity.toLocaleString()}</td>
                                <td className="p-4"><span className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[job.status] || ''}`}>{job.status.replace(/_/g, ' ')}</span></td>
                                <td className="p-4 text-center">
                                    {job.status === 'PRINTING_COMPLETE' && <button onClick={() => handleAction('pickup', job)} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md">Mark Picked Up</button>}
                                    {job.status === 'IN_TRANSIT' && <button onClick={() => handleAction('deliver', job)} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-cyan-500/30">Mark Delivered</button>}
                                    {job.status === 'PENDING_MANUFACTURER_CONFIRMATION' && <button onClick={() => handleAction('finalize', job)} className="whitespace-nowrap glass-button-sm text-xs font-bold py-1 px-3 rounded-md bg-orange-500/30">Finalize Delivery</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>}
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
function LogisticsActiveShipmentsPage() {
    const [queueJobs, setQueueJobs] = useState([]);
    const [inTransitJobs, setInTransitJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [queueRes, inTransitRes] = await Promise.all([
                apiClient.get('/api/logistics/pending-pickup'),
                apiClient.get('/api/logistics/in-transit')
            ]);
            setQueueJobs(queueRes.data);
            setInTransitJobs(inTransitRes.data);
        } catch (err) {
            setError('Failed to load active shipments data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAction = async (action, batch) => {
        setError('');
        if (action === 'finalize') {
            setCurrentBatch(batch);
            setIsModalOpen(true);
            return;
        }
        
        const confirmationMessage = action === 'pickup' ? 
            `Are you sure you want to mark Batch #${batch.id} as 'Picked Up'? This will notify the manufacturer.` :
            `Are you sure you want to mark Batch #${batch.id} as 'Delivered'? The manufacturer will need to provide a confirmation code.`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        try {
            await apiClient.put(`/api/logistics/batches/${batch.id}/${action}`, {});
            fetchData();
        } catch (err) {
            const errorMessage = err.response?.data?.error || `Failed to update batch #${batch.id}. Please try again.`;
            setError(errorMessage);
        }
    };

    const handleFinalizeSubmit = async (batchId, code) => {
        setIsSubmitting(true);
        setModalError('');
        try {
            await apiClient.post(`/api/logistics/batches/${batchId}/finalize`, { confirmation_code: code });
            setIsModalOpen(false);
            setCurrentBatch(null);
            fetchData();
        } catch(err) {
            const errorMessage = err.response?.data?.error || 'An unknown error occurred.';
            setModalError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentBatch(null);
        setModalError('');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {isModalOpen && <FinalizeModal batch={currentBatch} onClose={closeModal} onSubmit={handleFinalizeSubmit} isSubmitting={isSubmitting} error={modalError} />}
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Active Shipments</h1>
            {error && <p className="text-center p-4 text-red-400 bg-red-500/10 rounded-lg mb-4">{error}</p>}
            <div className="glass-panel p-1 sm:p-2">
                {isLoading ? <p className="text-center p-8 text-white/70">Loading jobs...</p> : (
                    <div>
                        <LogisticsJobsTable jobs={queueJobs} handleAction={handleAction} title="Pickup Queue" />
                        <LogisticsJobsTable jobs={inTransitJobs} handleAction={handleAction} title="In Transit" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default LogisticsActiveShipmentsPage;