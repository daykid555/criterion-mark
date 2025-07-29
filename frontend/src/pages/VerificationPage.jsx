// frontend/src/pages/VerificationPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import NodeBackground from '../components/NodeBackground';

const qrcodeRegionId = "qr-reader";

// --- NEW: User Consent Component ---
const ScanConsent = ({ onScan }) => (
    <div className="aspect-square w-full flex flex-col items-center justify-center bg-white/5 p-4 rounded-2xl text-center">
        <svg className="w-12 h-12 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
        <h3 className="font-bold text-white mb-2">Help Secure the Supply Chain</h3>
        <p className="text-white/70 text-sm mb-6">
            Scanning with your location helps us identify where counterfeit products are being found.
        </p>
        <div className="space-y-3 w-full">
            <button onClick={() => onScan(true)} className="w-full glass-button font-bold py-3 px-6 rounded-lg">
                Scan with Location
            </button>
            <button onClick={() => onScan(false)} className="w-full text-white/60 hover:text-white text-xs font-semibold">
                Scan without Location
            </button>
        </div>
        <p className="text-yellow-300 text-xs font-semibold p-2 bg-yellow-500/20 rounded-md mt-4">
            For your privacy, please avoid scanning in sensitive locations like your home.
        </p>
    </div>
);


const VerificationPage = () => {
    const [scanState, setScanState] = useState('idle'); // 'idle', 'scanning', 'loading', 'result'
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState('');
    const scannerRef = useRef(null);

    const startScanner = async (withLocation) => {
        setScanState('scanning');
        setError('');
        
        if (!scannerRef.current) scannerRef.current = new Html5Qrcode(qrcodeRegionId);
        
        const onScanSuccess = (decodedText) => {
            scannerRef.current.stop().then(() => {
                setScanState('loading');
                verifyCode(decodedText, withLocation);
            });
        };
        
        try {
            await scannerRef.current.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess);
        } catch (err) {
            setError("Could not start camera. Please grant camera permissions.");
            setScanState('idle');
        }
    };

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => setScanState('idle'));
        }
    };

    const verifyCode = async (code, withLocation) => {
        try {
            const config = {
                headers: { 'X-Use-Location': withLocation.toString() }
            };
            const response = await apiClient.get(`/api/verify/${code}`, config);
            setVerificationResult(response.data);
        } catch (err) {
            const errorText = err.response?.data?.message || 'Verification failed.';
            setVerificationResult({ status: 'error', message: errorText });
        } finally {
            setScanState('result');
        }
    };

    const resetState = () => {
        setVerificationResult(null);
        setError('');
        setScanState('idle');
    };

    // ... (renderResult function can be simplified)
    const renderResult = () => (
         <div className="mt-6 p-6 glass-panel flex flex-col items-center space-y-2 text-center">
             {/* ... Logic to display success or error message ... */}
             <button onClick={resetState} className="w-full glass-button mt-4 py-2 rounded-lg font-bold">Scan Another Product</button>
         </div>
    )


    return (
        <div className="min-h-screen w-full relative flex items-center justify-center">
            <NodeBackground />
            <div className="relative z-10 w-full max-w-md">
                <div className="glass-panel p-6 sm:p-8 space-y-6">
                    <h1 className="text-3xl font-bold text-center">Verify Product</h1>
                    
                    <div className="flex flex-col items-center">
                        <div id={qrcodeRegionId} className="w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                            {scanState === 'idle' && <ScanConsent onScan={startScanner} />}
                        </div>

                        {scanState === 'scanning' && <button onClick={stopScanner} className="w-full glass-button mt-6 py-2 rounded-lg font-bold">Stop Scanner</button>}
                        
                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

                        {scanState === 'loading' && <div className="mt-4">Loading...</div>}
                        
                        {scanState === 'result' && verificationResult && (
                            <div className="mt-4 w-full">
                                {/* Simplified Result Display */}
                                <div className={`p-4 rounded-lg text-center ${verificationResult.status === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                                    <p className="font-bold">{verificationResult.message}</p>
                                    {verificationResult.status === 'success' && <p className="text-xs">Product: {verificationResult.data.batch.drugName}</p>}
                                </div>
                                <button onClick={resetState} className="w-full glass-button mt-4 py-2 rounded-lg font-bold">Scan Another</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;