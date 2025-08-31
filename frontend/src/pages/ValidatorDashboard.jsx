// frontend/src/pages/ValidatorDashboardPage.jsx
// --- MODIFIED CODE ---

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { CheckCircleIcon, XCircleIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "validator-qr-reader";

// A component to show scan feedback
const ScanFeedback = ({ feedback }) => {
    if (!feedback.message) return null;

    const isSuccess = feedback.type === 'success';
    const bgColor = isSuccess ? 'bg-green-500/90' : 'bg-red-500/90';
    const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

    return (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg text-white shadow-2xl flex items-center ${bgColor}`}>
            <Icon className="w-8 h-8 mr-3" />
            <div>
                <p className="font-bold text-sm">{isSuccess ? 'SUCCESS' : 'ERROR'}</p>
                <p className="text-xs">{feedback.message}</p>
            </div>
        </div>
    );
};


function ValidatorDashboardPage() {
    const [mode, setMode] = useState('select_batch'); // 'select_batch' or 'scanning'
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [scanStats, setScanStats] = useState({ success: 0, error: 0 });
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

    const showFeedback = (type, message) => {
        if (feedbackTimerRef.current) {
            clearTimeout(feedbackTimerRef.current);
        }
        setFeedback({ type, message });
        feedbackTimerRef.current = setTimeout(() => {
            setFeedback({ type: '', message: '' });
        }, 2000); // Feedback disappears after 2 seconds
    };
    
    const handleScanSuccess = async (decodedText) => {
        try {
            const code = decodedText.split('/').pop();
            const response = await apiClient.post('/api/validator/scan', {
                qrCode: code,
                batchId: selectedBatch.id,
            });
            showFeedback('success', response.data.message);
            setScanStats(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed.';
            showFeedback('error', errorMessage);
            setScanStats(prev => ({ ...prev, error: prev.error + 1 }));
        }
    };
    
    const startScannerForBatch = (batch) => {
        setSelectedBatch(batch);
        setMode('scanning');

        // Delay starting the scanner to allow UI to update
        setTimeout(() => {
            if (!document.getElementById(qrcodeRegionId)) return;
            const html5QrCode = new Html5Qrcode(qrcodeRegionId);
            scannerRef.current = html5QrCode;
            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 5 },
                handleScanSuccess,
                () => {} 
            ).catch(err => {
                setError("CAMERA ERROR: Please grant camera permissions and refresh.");
                setMode('select_batch');
            });
        }, 100);
    };

    const stopScannerAndExit = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop()
                .then(() => {
                    setMode('select_batch');
                    setSelectedBatch(null);
                    setScanStats({ success: 0, error: 0 });
                })
                .catch(err => {
                     setMode('select_batch');
                     setSelectedBatch(null);
                     setScanStats({ success: 0, error: 0 });
                     console.error("Error stopping scanner:", err)
                });
        } else {
             setMode('select_batch');
             setSelectedBatch(null);
             setScanStats({ success: 0, error: 0 });
        }
    };

    if (loading) return <p className="text-center">Loading...</p>;
    if (error && mode === 'select_batch') return <p className="text-center text-red-400">{error}</p>;

    if (mode === 'scanning') {
        return (
            <div className="fixed inset-0 z-50 bg-black">
                <div id={qrcodeRegionId} className="w-full h-full"></div>
                <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent text-white">
                    <p className="text-sm">Validating Batch #{selectedBatch.id}</p>
                    <h1 className="text-xl font-bold">{selectedBatch.manufacturer.companyName} - {selectedBatch.drugName}</h1>
                    <div className="flex gap-4 mt-2">
                        <span className="text-green-400 font-bold">Success: {scanStats.success}</span>
                        <span className="text-red-400 font-bold">Errors: {scanStats.error}</span>
                    </div>
                </div>
                <button onClick={stopScannerAndExit} className="absolute bottom-5 left-1/2 -translate-x-1/2 glass-button py-2 px-6 rounded-lg font-bold">
                    End Session
                </button>
                <ScanFeedback feedback={feedback} />
            </div>
        );
    }
    
    return (
        <div className="bg-gray-800/50 p-6 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center">
               <DocumentMagnifyingGlassIcon className="w-8 h-8 mr-3 text-purple-400" />
               Select Batch for Validation
            </h1>
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

// FIX: Renamed component to avoid confusion, though not strictly necessary
export default ValidatorDashboardPage;