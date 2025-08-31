// frontend/src/pages/ValidatorDashboardPage.jsx
// --- FINAL CORRECTED VERSION ---

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
            bgColor = 'bg-green-500/90';
            Icon = CheckCircleIcon;
            break;
        case 'error':
            bgColor = 'bg-red-500/90';
            Icon = XCircleIcon;
            break;
        default: // 'info' for duplicates
            bgColor = 'bg-blue-500/90';
            Icon = ShieldExclamationIcon;
            break;
    }

    return (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg text-white shadow-2xl flex items-center transition-opacity duration-300 ${bgColor}`}>
            <Icon className="w-8 h-8 mr-3" />
            <div>
                <p className="font-bold text-sm">{feedback.type.toUpperCase()}</p>
                <p className="text-xs">{feedback.message}</p>
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

    // Fetch batches on component mount
    useEffect(() => {
        apiClient.get('/api/validator/pending-batches')
            .then(res => {
                setBatches(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load pending batches.');
                setLoading(false);
            });
    }, []);
    
    // Cleanup scanner when the component unmounts or mode changes
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Cleanup failed:", err));
            }
        };
    }, [mode]);

    const playAudio = (sound) => {
        try { new Audio(`/sounds/${sound}.mp3`).play(); } 
        catch (e) { console.warn("Could not play audio feedback.", e); }
    };

    const showFeedback = (type, message, duration = 2000) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, duration);
    };
    
    const handleScan = async (decodedText) => {
        if (isPaused) return;

        setIsPaused(true);
        const code = decodedText.split('/').pop();

        if (scannedCodes.has(code)) {
            playAudio('duplicate');
            showFeedback('info', `Already scanned: ${code}`);
            setTimeout(() => setIsPaused(false), 1500);
            return;
        }

        setScannedCodes(prev => new Set(prev).add(code));

        try {
            const response = await apiClient.post('/api/validator/scan', {
                qrCode: code,
                batchId: selectedBatch.id,
            });
            playAudio('success');
            showFeedback('success', response.data.message);
            setScanStats(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (err) {
            playAudio('error');
            const errorMessage = err.response?.data?.message || 'Verification failed.';
            showFeedback('error', errorMessage);
            setScanStats(prev => ({ ...prev, error: prev.error + 1 }));
        } finally {
            setTimeout(() => setIsPaused(false), 1500);
        }
    };
    
    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setMode('scanning');
        setScannedCodes(new Set());
        setError('');

        setTimeout(() => {
            const qrScanner = new Html5Qrcode(qrcodeRegionId);
            scannerRef.current = qrScanner;
            
            qrScanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleScan,
                (errorMessage) => {}
            ).catch(err => {
                setError("CAMERA ERROR: Please grant camera permissions and refresh.");
                setMode('select_batch');
            });
        }, 100);
    };

    const stopScannerAndExit = () => {
        setMode('select_batch');
        setSelectedBatch(null);
        setScanStats({ success: 0, error: 0 });
        setScannedCodes(new Set());
    };

    if (loading) return <p className="text-center text-white">Loading batches...</p>;

    // --- SCANNING VIEW (Styled like VerificationPage.jsx) ---
    if (mode === 'scanning' && selectedBatch) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div>
                        <p className="text-sm font-light text-white/70">Validating Batch #{selectedBatch.id}</p>
                        <h1 className="text-2xl font-bold text-white leading-tight">{selectedBatch.manufacturer.companyName} - {selectedBatch.drugName}</h1>
                    </div>
                    
                    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg aspect-square relative">
                        <div id={qrcodeRegionId}></div>
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
        <div className="bg-gray-800/50 p-6 rounded-lg">
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