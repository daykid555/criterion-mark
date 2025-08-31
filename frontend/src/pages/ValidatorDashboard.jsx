import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { CheckCircleIcon, XCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "validator-qr-reader";

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

function ValidatorDashboardPage() {
    const [mode, setMode] = useState('select_batch');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [sessionStats, setSessionStats] = useState({});
    const [currentStats, setCurrentStats] = useState({ success: 0, error: 0, duplicate: 0 });
    const [scannedCodes, setScannedCodes] = useState(new Set());
    const scannerRef = useRef(null);
    const isProcessingRef = useRef(false);
    const resumeTimerRef = useRef(null);
    const feedbackTimerRef = useRef(null);

    useEffect(() => {
        apiClient.get('/api/validator/pending-batches')
            .then(res => setBatches(res.data))
            .catch(err => setError('Failed to load pending batches.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const stopScanner = () => {
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(err => {
                        console.error("Error stopping scanner on cleanup:", err);
                    });
                }
                scannerRef.current = null;
            }
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };

        if (mode !== 'scanning') {
            stopScanner();
        }
        return stopScanner;
    }, [mode]); // Rerunning on mode change ensures cleanup when switching views.

    const playAudio = (sound) => {
        try { new Audio(`/sounds/${sound}.mp3`).play(); }
        catch (e) { /* Audio error ignored */ }
    };

    const showFeedback = (type, message, duration = 2000) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), duration);
    };

    const handleScan = async (decodedText) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        if (scannerRef.current) {
            try {
                scannerRef.current.pause(true);
            } catch (e) {
                console.error("Failed to pause scanner", e);
            }
        }

        const code = decodedText.split('/').pop();
        
        if (scannedCodes.has(code)) {
            playAudio('duplicate');
            showFeedback('duplicate', `Already scanned`);
            setCurrentStats(stats => ({ ...stats, duplicate: stats.duplicate + 1 }));
            return;
        }

        try {
            const response = await apiClient.post('/api/validator/scan', { qrCode: code, batchId: selectedBatch.id });
            setScannedCodes(prev => new Set(prev).add(code));
            playAudio('success');
            showFeedback('success', response.data.message);
            setCurrentStats(stats => ({ ...stats, success: stats.success + 1 }));
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed.';
            if (err.response?.status === 409) {
                setScannedCodes(prev => new Set(prev).add(code));
                playAudio('duplicate');
                showFeedback('duplicate', errorMessage);
                setCurrentStats(stats => ({ ...stats, duplicate: stats.duplicate + 1 }));
            } else {
                playAudio('error');
                showFeedback('error', errorMessage);
                setCurrentStats(stats => ({ ...stats, error: stats.error + 1 }));
            }
        }

        // Resume scanning after a 1.5s delay to prevent re-scans.
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            if (scannerRef.current && scannerRef.current.getState() === 3 /* PAUSED */) {
                scannerRef.current.resume().catch(err => console.error("Failed to resume scanner", err));
            }
            isProcessingRef.current = false;
        }, 1500);
    };

    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setCurrentStats({ success: 0, error: 0, duplicate: 0 });
        setScannedCodes(new Set());
        setError('');
        setMode('scanning');
        setTimeout(() => {
            if (!document.getElementById(qrcodeRegionId)) {
                console.error("QR Code region not found");
                return;
            }
            const qrScanner = new Html5Qrcode(qrcodeRegionId, { verbose: false });
            scannerRef.current = qrScanner;
            qrScanner.start(
                { facingMode: "environment" },
                { 
                    fps: 10,
                    // No qrbox is defined, so the library will not show a viewfinder or shaded region.
                },
                handleScan,
                () => { /* error callback, ignored for continuous scanning */ }
            ).then(() => {
                const video = document.getElementById(qrcodeRegionId)?.querySelector('video');
                if (video) {
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.objectFit = 'cover';
                }
            })
            .catch((err) => {
                console.error("Camera start error:", err);
                setError("CAMERA ERROR: Please grant camera permissions and refresh.");
                setMode('select_batch');
            });
        }, 200);
    };

    const stopScannerAndExit = () => {
        setMode('select_batch');
        setSessionStats(prev => ({
            ...prev,
            [selectedBatch.id]: { ...currentStats }
        }));
        setSelectedBatch(null);
    };

    if (loading) return <p className="text-center text-white">Loading...</p>;

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
                    <div className="flex justify-around items-center pt-2">
                        <span className="text-green-600 font-bold text-xl">Success: {currentStats.success}</span>
                        <span className="text-red-600 font-bold text-xl">Errors: {currentStats.error}</span>
                        <span className="text-blue-600 font-bold text-xl">Duplicate: {currentStats.duplicate}</span>
                    </div>
                    <button onClick={stopScannerAndExit} className="w-full glass-button mt-4 py-3 rounded-lg font-bold text-lg">End Session</button>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </div>
                <ScanFeedback feedback={feedback} />
            </>
        );
    }

    return (
        <div className="glass-panel p-8 space-y-6 w-full max-w-xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Validation</h1>
                <p className="text-gray-500 mb-4">Select a batch to begin scanning and validating products.</p>
            </div>
            <div className="space-y-3">
                {error && <p className="text-center text-red-400 mb-4">{error}</p>}
                {batches.length > 0 ? (
                    batches.map(batch => (
                        <div key={batch.id} className="glass-panel p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-900">Batch #{batch.id} - {batch.drugName}</p>
                                <p className="text-sm text-gray-500">{batch.manufacturer.companyName}</p>
                                {sessionStats[batch.id] && (
                                    <div className="mt-2 text-xs text-gray-700">
                                        <span className="mr-4">Success: <span className="font-bold text-green-600">{sessionStats[batch.id].success}</span></span>
                                        <span className="mr-4">Errors: <span className="font-bold text-red-600">{sessionStats[batch.id].error}</span></span>
                                        <span>Duplicate: <span className="font-bold text-blue-600">{sessionStats[batch.id].duplicate}</span></span>
                                    </div>
                                )}
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