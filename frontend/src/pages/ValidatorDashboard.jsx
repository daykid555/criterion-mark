// frontend/src/pages/ValidatorDashboard.jsx
// --- COMPLETELY REBUILT & FIXED ---

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { CheckCircleIcon, XCircleIcon, DocumentMagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "validator-qr-reader";

// --- New, Integrated Scan Feedback for Scanner View ---
const ScannerFeedback = ({ feedback }) => {
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className={`flex flex-col items-center justify-center p-8 rounded-lg text-white shadow-2xl ${bgColor}`}>
                <Icon className="w-16 h-16 mb-4" />
                <p className="font-bold text-lg">{feedback.type.toUpperCase()}</p>
                <p>{feedback.message}</p>
            </div>
        </div>
    );
};


function ValidatorDashboardPage() {
    const [mode, setMode] = useState('select_batch');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [scanStats, setScanStats] = useState({ success: 0, error: 0 });
    
    // --- NEW STATE MANAGEMENT ---
    const [scannedCodes, setScannedCodes] = useState(new Set()); // Tracks codes in this session
    const [isPaused, setIsPaused] = useState(false); // Pauses scanner after a scan
    
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
    
    // Cleanup scanner on component unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Cleanup failed:", err));
            }
        };
    }, []);

    // --- NEW AUDIO UTILITY ---
    const playAudio = (sound) => {
        try {
            new Audio(`/sounds/${sound}.mp3`).play();
        } catch (e) {
            console.warn("Could not play audio feedback.", e);
        }
    };

    const showFeedback = (type, message, duration = 1500) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, duration);
    };
    
    const handleScanSuccess = async (decodedText) => {
        if (isPaused) return; // Ignore scans if paused

        setIsPaused(true); // Pause immediately
        const code = decodedText.split('/').pop();

        // --- NEW: Check for duplicates in this session ---
        if (scannedCodes.has(code)) {
            playAudio('duplicate');
            showFeedback('info', `Code ${code} already scanned.`);
            setTimeout(() => setIsPaused(false), 1500); // Unpause
            return;
        }

        // Add to session's scanned codes
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
            setTimeout(() => setIsPaused(false), 1500); // Unpause after 1.5s
        }
    };
    
    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setMode('scanning');
        setScannedCodes(new Set()); // Reset session codes

        setTimeout(() => {
            if (!document.getElementById(qrcodeRegionId)) return;
            const html5QrCode = new Html5Qrcode(qrcodeRegionId);
            scannerRef.current = html5QrCode;
            
            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleScanSuccess,
                (errorMessage) => {} // Optional error callback, we handle errors in success callback
            ).catch(err => {
                setError("CAMERA ERROR: Please grant camera permissions and refresh the page.");
                setMode('select_batch');
            });
        }, 100);
    };

    const stopScannerAndExit = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop()
                .finally(() => {
                    setMode('select_batch');
                    setSelectedBatch(null);
                    setScanStats({ success: 0, error: 0 });
                    setScannedCodes(new Set());
                });
        } else {
             setMode('select_batch');
             setSelectedBatch(null);
             setScanStats({ success: 0, error: 0 });
             setScannedCodes(new Set());
        }
    };

    if (loading) return <p className="text-center text-white">Loading batches...</p>;
    
    // --- FULL SCREEN SCANNER UI (REDESIGNED) ---
    if (mode === 'scanning') {
        return (
            <div className="fixed inset-0 z-50 bg-black text-white">
                {/* The div for the scanner video stream */}
                <div id={qrcodeRegionId} className="w-full h-full object-cover"></div>

                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[300px] h-[300px] border-4 border-white/50 rounded-2xl shadow-lg" />
                </div>
                
                {/* Top Information Bar */}
                <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <p className="text-sm font-light opacity-80">Validating Batch #{selectedBatch.id}</p>
                    <h1 className="text-xl font-bold">{selectedBatch.manufacturer.companyName} - {selectedBatch.drugName}</h1>
                    <div className="flex gap-6 mt-2 text-lg">
                        <span className="text-green-400 font-bold">Success: {scanStats.success}</span>
                        <span className="text-red-400 font-bold">Errors: {scanStats.error}</span>
                    </div>
                </div>

                {/* Bottom Control Button */}
                <div className="absolute bottom-0 left-0 w-full p-6 flex justify-center">
                    <button 
                        onClick={stopScannerAndExit} 
                        className="bg-red-600/80 backdrop-blur-sm hover:bg-red-500 transition-colors py-3 px-8 rounded-lg font-bold text-lg shadow-2xl"
                    >
                        End Session
                    </button>
                </div>
                
                {/* Feedback Overlay */}
                <ScannerFeedback feedback={feedback} />
            </div>
        );
    }
    
    // --- Batch Selection UI (UNCHANGED) ---
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