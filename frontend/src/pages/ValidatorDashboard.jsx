import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { CheckCircleIcon, XCircleIcon, DocumentMagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "validator-qr-reader";

const ScanFeedback = ({ feedback }) => {
    if (!feedback.message) return null;
    let bgColor, Icon;
    switch (feedback.type) {
        case 'success': bgColor = 'bg-green-500'; Icon = CheckCircleIcon; break;
        case 'error': bgColor = 'bg-red-500'; Icon = XCircleIcon; break;
        case 'info': bgColor = 'bg-blue-500'; Icon = ShieldExclamationIcon; break;
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

// Remove html5-qrcode viewfinder overlays
const removeViewfinder = () => {
    setTimeout(() => {
        const region = document.getElementById(qrcodeRegionId);
        if (region) {
            // Remove all children except video
            Array.from(region.children).forEach(child => {
                if (child.tagName !== 'VIDEO') child.style.display = 'none';
            });
            const video = region.querySelector('video');
            if (video) {
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                video.style.borderRadius = '1rem';
                video.style.background = 'transparent';
            }
        }
    }, 500);
};

function ValidatorDashboardPage() {
    const [mode, setMode] = useState('select_batch');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [scanStats, setScanStats] = useState({ success: 0, error: 0 });
    const [scannedCodes, setScannedCodes] = useState(new Set());
    const scannerRef = useRef(null);
    const feedbackTimerRef = useRef(null);

    useEffect(() => {
        apiClient.get('/api/validator/pending-batches')
            .then(res => setBatches(res.data))
            .catch(err => setError('Failed to load pending batches.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const stopScanner = () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
            }
        };
        if (mode !== 'scanning') stopScanner();
        return () => stopScanner();
    }, [mode]);

    const playAudio = (sound) => {
        try { new Audio(`/sounds/${sound}.mp3`).play(); }
        catch (e) { /* Audio error ignored */ }
    };

    const showFeedback = (type, message, duration = 2500) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), duration);
    };

    const handleScan = async (decodedText) => {
        if (!scannerRef.current) return;
        scannerRef.current.pause(true);

        const code = decodedText.split('/').pop();
        if (scannedCodes.has(code)) {
            playAudio('duplicate');
            showFeedback('info', `Already scanned`);
            setTimeout(() => scannerRef.current.resume(), 1500);
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
            if (err.response?.status === 409) {
                setScannedCodes(prev => new Set(prev).add(code));
                playAudio('duplicate');
                showFeedback('info', errorMessage);
            } else {
                playAudio('error');
                showFeedback('error', errorMessage);
                setScanStats(prev => ({ ...prev, error: prev.error + 1 }));
            }
        } finally {
            setTimeout(() => scannerRef.current.resume(), 1500);
        }
    };

    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setScanStats({ success: 0, error: 0 });
        setScannedCodes(new Set());
        setError('');
        setMode('scanning');
        setTimeout(() => {
            if (!document.getElementById(qrcodeRegionId)) return;
            const qrScanner = new Html5Qrcode(qrcodeRegionId);
            scannerRef.current = qrScanner;
            qrScanner.start(
                { facingMode: "environment" },
                { fps: 5 },
                handleScan,
                () => {}
            ).then(removeViewfinder)
            .catch(() => {
                setError("CAMERA ERROR: Please grant camera permissions and refresh.");
                setMode('select_batch');
            });
        }, 200);
    };

    const stopScannerAndExit = () => setMode('select_batch');

    if (loading) return <p className="text-center text-white">Loading...</p>;

    if (mode === 'scanning' && selectedBatch) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-animated bg-[length:400%_400%] animate-gradient">
                <div className="glass-panel p-6 sm:p-8 space-y-4 w-full max-w-md mx-auto">
                    <div>
                        <p className="text-sm font-light text-white/70">Validating Batch #{selectedBatch.id}</p>
                        <h1 className="text-2xl font-bold text-white leading-tight">{selectedBatch.manufacturer.companyName} - {selectedBatch.drugName}</h1>
                    </div>
                    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg aspect-square relative">
                        <div id={qrcodeRegionId} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                    <div className="flex justify-around items-center pt-2">
                        <span className="text-green-400 font-bold text-xl">Success: {scanStats.success}</span>
                        <span className="text-red-400 font-bold text-xl">Errors: {scanStats.error}</span>
                    </div>
                    <button onClick={stopScannerAndExit} className="w-full glass-button mt-4 py-3 rounded-lg font-bold text-lg">End Session</button>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </div>
                <ScanFeedback feedback={feedback} />
            </div>
        );
    }

    // Batch selection UI matches VerificationPage style
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-animated bg-[length:400%_400%] animate-gradient">
            <div className="glass-panel p-8 space-y-6 w-full max-w-md mx-auto">
                <div className="text-center text-white">
                    <h1 className="text-3xl font-bold">Select Batch for Validation</h1>
                    <p className="opacity-80 mt-2">Choose a batch below to begin scanning and validating products.</p>
                </div>
                <div className="space-y-3">
                    {error && <p className="text-center text-red-400 mb-4">{error}</p>}
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
        </div>
    );
}

export default ValidatorDashboardPage;