// frontend/src/pages/ValidatorDashboardPage.jsx
// --- DEFINITIVE, CORRECTED VERSION ---

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { CheckCircleIcon, XCircleIcon, DocumentMagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "validator-qr-reader";

// --- Toast-style Feedback Component ---
const ScanFeedback = ({ feedback }) => {
    if (!feedback.message) return null;

    let bgColor, Icon;
    switch (feedback.type) {
        case 'success':
            bgColor = 'bg-green-500'; Icon = CheckCircleIcon; break;
        case 'error':
            bgColor = 'bg-red-500'; Icon = XCircleIcon; break;
        default: // 'info' for duplicates/already scanned
            bgColor = 'bg-blue-500'; Icon = ShieldExclamationIcon; break;
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
    const [scanStats, setScanStats] = useState({ success: 0, error: 0 });
    const [scannedCodes, setScannedCodes] = useState(new Set());
    const [isPaused, setIsPaused] = useState(false);
    
    const scannerRef = useRef(null);
    const feedbackTimerRef = useRef(null);

    useEffect(() => {
        apiClient.get('/api/validator/pending-batches')
            .then(res => setBatches(res.data))
            .catch(err => setError('Failed to load pending batches.'))
            .finally(() => setLoading(false));
    }, []);
    
    useEffect(() => {
        // This function ensures the scanner is stopped when we leave the scanning mode.
        const stopScanner = () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup:", err));
                scannerRef.current = null;
            }
        };
        if (mode !== 'scanning') {
            stopScanner();
        }
        return () => stopScanner();
    }, [mode]);

    const playAudio = (sound) => {
        console.log(`Attempting to play sound: ${sound}`); // For debugging
        try { new Audio(`/sounds/${sound}.mp3`).play(); } 
        catch (e) { console.error("Audio playback failed:", e); }
    };

    const showFeedback = (type, message, duration = 2500) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), duration);
    };
    
    const handleScan = async (decodedText) => {
        if (isPaused) return;

        setIsPaused(true);
        const code = decodedText.split('/').pop();

        if (scannedCodes.has(code)) {
            playAudio('duplicate');
            showFeedback('info', `Already scanned in this session.`);
            setTimeout(() => setIsPaused(false), 1500);
            return;
        }

        try {
            const response = await apiClient.post('/api/validator/scan', { qrCode: code, batchId: selectedBatch.id });
            setScannedCodes(prev => new Set(prev).add(code));
            playAudio('success');
            showFeedback('success', response.data.message);
            setScanStats(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed.';
            // --- INTELLIGENT ERROR HANDLING ---
            if (err.response && err.response.status === 409) {
                // This is a code that has already been processed (e.g., status is VALIDATED or USED).
                // It's not a "hard error," it's an "info" case.
                setScannedCodes(prev => new Set(prev).add(code)); // Add to session so we don't hit the API again
                playAudio('duplicate');
                showFeedback('info', errorMessage); // Show the specific reason from the backend
                // DO NOT increment the error counter for this case.
            } else {
                // This is a true error (e.g., code not found, server error).
                playAudio('error');
                showFeedback('error', errorMessage);
                setScanStats(prev => ({ ...prev, error: prev.error + 1 }));
            }
        } finally {
            setTimeout(() => setIsPaused(false), 1500); // Unpause after processing
        }
    };
    
    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setScanStats({ success: 0, error: 0 });
        setScannedCodes(new Set());
        setError('');
        setMode('scanning');

        // Delay to allow UI to render the div
        setTimeout(() => {
            if (!document.getElementById(qrcodeRegionId)) {
                console.error("QR Code reader element not found in DOM.");
                setError("Could not initialize camera. Please try again.");
                setMode('select_batch');
                return;
            }
            const qrScanner = new Html5Qrcode(qrcodeRegionId, { formatsToSupport: [0] }); // 0 = QR_CODE
            scannerRef.current = qrScanner;
            
            qrScanner.start(
                { facingMode: "environment" },
                { fps: 5, qrbox: (viewfinderWidth, viewfinderHeight) => ({ width: viewfinderWidth * 0.7, height: viewfinderHeight * 0.7 }) },
                handleScan,
                (errorMessage) => { /* Ignore continuous errors */ }
            ).catch(err => {
                setError("CAMERA ERROR: Please grant camera permissions and refresh the page.");
                setMode('select_batch');
            });
        }, 200);
    };

    const stopScannerAndExit = () => {
        setMode('select_batch');
    };

    if (loading) return <p className="text-center text-white">Loading batches...</p>;

    // --- SCANNING VIEW (UI FIXED) ---
    if (mode === 'scanning' && selectedBatch) {
        return (
            <div className="w-full max-w-lg mx-auto">
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div>
                        <p className="text-sm font-light text-white/70">Validating Batch #{selectedBatch.id}</p>
                        <h1 className="text-2xl font-bold text-white leading-tight">{selectedBatch.manufacturer.companyName} - {selectedBatch.drugName}</h1>
                    </div>
                    
                    {/* --- UI FIX: NO MORE BLACK BOX --- */}
                    <div className="w-full rounded-2xl overflow-hidden shadow-lg relative aspect-square">
                        <div id={qrcodeRegionId} className="w-full h-full" />
                    </div>

                    <div className="flex justify-around items-center pt-2">
                        <span className="text-green-400 font-bold text-xl">Success: {scanStats.success}</span>
                        <span className="text-red-400 font-bold text-xl">Errors: {scanStats.error}</span>
                    </div>
                    
                    <button onClick={stopScannerAndExit} className="w-full glass-button mt-4 py-3 rounded-lg font-bold text-lg">
                        End Session
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </div>
                <ScanFeedback feedback={feedback} />
            </div>
        );
    }
    
    // --- BATCH SELECTION VIEW ---
    return (
        <div className="bg-gray-800/50 p-6 rounded-lg max-w-lg mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center">
               <DocumentMagnifyingGlassIcon className="w-8 h-8 mr-3 text-purple-400" />
               Select Batch for Validation
            </h1>
            {error && <p className="text-center text-red-400 mb-4">{error}</p>}
            <div className="space-y-3">
                {batches.length > 0 ? (
                    batches.map(batch => (
                        <div key={batch.id} className="glass-panel p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">Batch #{batch.id} - {batch.drugName}</p>
                                <p className="text-sm text-gray-400">{batch.manufacturer.companyName}</p>
                            </div>
                            <button onClick={() => startScannerForBatch(batch)} className="glass-button-sm py-2 px-4 text-sm rounded-lg">
                                Start Scanning
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 py-8">No batches are currently awaiting validation.</p>
                )}
            </div>
        </div>
    );
}

export default ValidatorDashboardPage;