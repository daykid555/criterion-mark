// frontend/src/pages/ValidatorDashboardPage.jsx
// --- IMPLEMENTATION OF THE "SNAP AND VALIDATE" WORKFLOW ---

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { CheckCircleIcon, XCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "validator-qr-reader";

// --- UI Components (As Provided) ---
const ScanFeedback = ({ feedback }) => {
    if (!feedback.message) return null;
    let bgColor, Icon;
    switch (feedback.type) {
        case 'success': bgColor = 'bg-green-500'; Icon = CheckCircleIcon; break;
        case 'error': bgColor = 'bg-red-500'; Icon = XCircleIcon; break;
        case 'duplicate': bgColor = 'bg-blue-500'; Icon = ShieldExclamationIcon; break;
        default: bgColor = 'bg-blue-500'; Icon = ShieldExclamationIcon; break;
    }
    return (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg text-white shadow-2xl flex items-center`}>
            <div className={`absolute inset-0 ${bgColor} opacity-90 rounded-lg`}></div>
            <div className="relative z-10 flex items-center">
                <Icon className="w-8 h-8 mr-3" />
                <div>
                    <p className="font-bold text-sm">{feedback.type.toUpperCase()}</p>
                    <p className="text-xs">{feedback.message}</p>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
function ValidatorDashboardPage() {
    const [mode, setMode] = useState('select_batch');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [sessionStats, setSessionStats] = useState({});
    
    // State for the "Snap and Validate" workflow
    const [snappedCodes, setSnappedCodes] = useState(new Set());
    const [isProcessingValidation, setIsProcessingValidation] = useState(false);
    const [validationResults, setValidationResults] = useState(null);

    const scannerRef = useRef(null);
    const feedbackTimerRef = useRef(null);
    const lastScannedCode = useRef(null);
    const lastScanTime = useRef(0);

    // Fetch initial data
    useEffect(() => {
        apiClient.get('/api/validator/pending-batches')
            .then(res => setBatches(res.data))
            .catch(err => setError('Failed to load pending batches.'))
            .finally(() => setLoading(false));
    }, []);

    // Scanner lifecycle management
    useEffect(() => {
        const stopScanner = () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => {
                    console.error("Error stopping scanner on cleanup:", err);
                });
            }
        };

        if (mode === 'scanning' && selectedBatch) {
            const qrScanner = new Html5Qrcode(qrcodeRegionId, { verbose: false });
            scannerRef.current = qrScanner;
            
            qrScanner.start(
                { facingMode: "environment" },
                { fps: 10 },
                handleScan,
                () => { /* error callback ignored */ }
            ).then(() => {
                // Style the video element to fill its container seamlessly
                const video = document.getElementById(qrcodeRegionId)?.querySelector('video');
                if (video) {
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.objectFit = 'cover';
                }
            }).catch((err) => {
                console.error("Camera start error:", err);
                setError("CAMERA ERROR: Please grant camera permissions and refresh.");
                setMode('select_batch');
            });
        }
        
        return () => {
            stopScanner();
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        };
    }, [mode, selectedBatch]);

    const playAudio = (sound) => {
        try { new Audio(`/sounds/${sound}.mp3`).play(); } 
        catch (e) { console.error(`Audio playback failed for ${sound}.mp3`, e); }
    };

    const showFeedback = (type, message, duration = 2000) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), duration);
    };

    // "Snap" phase: Capture codes locally without calling the API.
    const handleScan = (decodedText) => {
        const now = Date.now();
        const code = decodedText.split('/').pop();

        // Debounce to prevent the same code from being rapidly re-added.
        if (code === lastScannedCode.current && (now - lastScanTime.current < 1500)) {
            return;
        }
        lastScannedCode.current = code;
        lastScanTime.current = now;

        if (!snappedCodes.has(code)) {
            playAudio('success'); // A quick "snap" sound
            setSnappedCodes(prev => new Set(prev).add(code));
        } else {
            playAudio('duplicate');
            showFeedback('duplicate', `Code already captured`, 1000);
        }
    };

    // "Validate" phase: Send all snapped codes to the backend.
    const handleBatchValidate = async () => {
        if (snappedCodes.size === 0) {
            showFeedback('error', 'No codes captured to validate.');
            return;
        }
        setIsProcessingValidation(true);
        setValidationResults(null);
        setError('');

        try {
            // CRITICAL: Requires a new backend endpoint that accepts an array of codes.
            const response = await apiClient.post('/api/validator/scan-batch', {
                codes: Array.from(snappedCodes),
                batchId: selectedBatch.id
            });
            setValidationResults(response.data); // Expects { success: N, error: N, duplicate: N }
            showFeedback('success', `Validation complete.`);
            setSnappedCodes(new Set()); // Clear for the next session within the same batch
        } catch (err) {
            setError(err.response?.data?.message || 'Batch validation failed.');
            showFeedback('error', err.response?.data?.message || 'Batch validation failed.');
        } finally {
            setIsProcessingValidation(false);
        }
    };

    const handleClearSnappedCodes = () => {
        setSnappedCodes(new Set());
        setValidationResults(null);
        playAudio('error'); // Use a distinct sound for a clear action
        showFeedback('info', 'Cleared all captured codes.');
    };
    
    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setSnappedCodes(new Set());
        setValidationResults(null);
        setError('');
        setMode('scanning');
    };

    const stopScannerAndExit = () => {
        setMode('select_batch');
        if (validationResults) {
            // Persist the results of the last validation to the main dashboard
            setSessionStats(prev => ({
                ...prev,
                [selectedBatch.id]: { ...validationResults }
            }));
        }
        setSelectedBatch(null);
    };

    if (loading) return <p className="text-center text-white">Loading...</p>;
    
    // --- Scanning View (Your UI) ---
    if (mode === 'scanning' && selectedBatch) {
        return (
            <>
                <div className="glass-panel p-6 space-y-4 w-full max-w-xl mx-auto">
                    <div>
                        <p className="text-sm font-light text-gray-500">Validating Batch #{selectedBatch.id}</p>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{selectedBatch.manufacturer.companyName} - {selectedBatch.drugName}</h1>
                    </div>
                    <div className="w-full rounded-2xl overflow-hidden aspect-square" style={{ background: '#222' }}>
                        <div id={qrcodeRegionId} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                    
                    <div className="text-center py-2">
                        <span className="text-gray-800 font-bold text-3xl">{snappedCodes.size}</span>
                        <p className="text-gray-500 text-sm">Codes Captured</p>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                        <button onClick={handleBatchValidate} disabled={isProcessingValidation || snappedCodes.size === 0} className="flex-grow glass-button py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessingValidation ? 'Validating...' : `Validate ${snappedCodes.size} Captured Codes`}
                        </button>
                        <button onClick={handleClearSnappedCodes} disabled={isProcessingValidation || snappedCodes.size === 0} className="w-1/4 glass-button-sm bg-gray-200 text-gray-700 py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            Clear
                        </button>
                    </div>

                    {validationResults && (
                        <div className="flex justify-around items-center pt-2 border-t border-gray-200 mt-4">
                            <span className="text-green-600 font-bold text-lg">Success: {validationResults.success}</span>
                            <span className="text-red-600 font-bold text-lg">Errors: {validationResults.error}</span>
                            <span className="text-blue-600 font-bold text-lg">Duplicate: {validationResults.duplicate}</span>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                    <button onClick={stopScannerAndExit} className="w-full text-center text-gray-500 hover:text-gray-800 text-sm mt-4">End Session</button>
                </div>
                <ScanFeedback feedback={feedback} />
            </>
        );
    }

    // --- Batch Selection View (Your UI) ---
    return (
        <div className="glass-panel p-8 space-y-6 w-full max-w-5xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Validation</h1>
                <p className="text-gray-500 mb-4">Select a batch to begin scanning and validating products.</p>
            </div>
            <div className="overflow-x-auto">
                {error && <p className="text-center text-red-400 mb-4">{error}</p>}
                {batches.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Session</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-gray-200">
                            {batches.map(batch => (
                                <tr key={batch.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{batch.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{batch.drugName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.manufacturer.companyName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {sessionStats[batch.id] ? (
                                            <div className="flex items-center space-x-2">
                                                <span title="Success" className="flex items-center text-green-600"><CheckCircleIcon className="w-4 h-4 mr-1" /> {sessionStats[batch.id].success}</span>
                                                <span title="Errors" className="flex items-center text-red-600"><XCircleIcon className="w-4 h-4 mr-1" /> {sessionStats[batch.id].error}</span>
                                                <span title="Duplicates" className="flex items-center text-blue-600"><ShieldExclamationIcon className="w-4 h-4 mr-1" /> {sessionStats[batch.id].duplicate}</span>
                                            </div>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => startScannerForBatch(batch)} className="glass-button-sm py-2 px-4 text-sm rounded-lg">
                                            Start Scanning
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-400 py-8">No batches are currently awaiting validation.</p>
                )}
            </div>
        </div>
    );
}

export default ValidatorDashboardPage;