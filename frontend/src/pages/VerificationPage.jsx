// frontend/src/pages/VerificationPage.jsx
// actually complete code

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import NodeBackground from '../components/NodeBackground';
import { ShieldCheckIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const qrcodeRegionId = "qr-reader";

const ScanConsent = ({ onScan }) => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
        <svg className="w-12 h-12 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
        <h3 className="font-bold text-white mb-2">Help Secure Your Medication</h3>
        <p className="text-white/80 text-sm mb-6">Scanning with location is most useful at the pharmacy to help us track counterfeit hotspots.</p>
        <div className="space-y-3 w-full max-w-xs">
            <button onClick={() => onScan(true)} className="w-full glass-button font-bold py-3 px-6 rounded-lg">Scan with Location</button>
            <button onClick={() => onScan(false)} className="w-full text-white/60 hover:text-white text-xs font-semibold">Scan without Location</button>
        </div>
        <p className="text-yellow-300 text-xs font-semibold p-2 bg-yellow-500/20 rounded-md mt-4">For your privacy, please use the "without location" option when scanning at home.</p>
    </div>
);

const VerificationResult = ({ result, onReset, isAnimating }) => {
    const isSuccess = result.status === 'success';
    const hasWarning = !!result.warning;
    const isError = result.status === 'error';

    const getTheme = () => {
        if (isError) return {
            bg: 'bg-red-500/20', text: 'text-red-200', iconColor: 'text-red-400',
            Icon: XCircleIcon, animation: 'animate-blink-red'
        };
        if (hasWarning) return {
            bg: 'bg-yellow-500/20', text: 'text-yellow-200', iconColor: 'text-yellow-400',
            Icon: ExclamationTriangleIcon, animation: 'animate-blink-yellow'
        };
        return {
            bg: 'bg-green-500/20', text: 'text-green-200', iconColor: 'text-green-400',
            Icon: ShieldCheckIcon, animation: 'animate-blink-green'
        };
    };

    const { bg, text, iconColor, Icon, animation } = getTheme();
    const animationClass = isAnimating ? animation : '';
    const data = result.data?.batch;
    const scanCount = result.data?.scanRecords?.length || 0;

    return (
        <div className="w-full max-w-md mx-auto my-4">
            <div className={`glass-panel p-6 rounded-xl text-white ${bg} border ${text.replace('text-', 'border-')} ${animationClass}`}>
                <div className="flex flex-col items-center text-center">
                    <Icon className={`w-16 h-16 ${iconColor}`} />
                    <h2 className={`mt-4 text-2xl font-bold ${text.replace('200', '100')}`}>{result.message}</h2>
                    
                    {hasWarning && (
                        <p className={`mt-2 text-sm ${text}`}>{result.warning}</p>
                    )}
                </div>

                {isSuccess && data && (
                    <div className="mt-6 border-t border-white/20 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="font-semibold text-white/60">Product:</span> <span className="font-bold text-right">{data.drugName}</span></div>
                        <div className="flex justify-between"><span className="font-semibold text-white/60">Manufacturer:</span> <span className="font-bold text-right">{data.manufacturer.companyName}</span></div>
                        <div className="flex justify-between"><span className="font-semibold text-white/60">Batch Number:</span> <span className="font-bold text-right">{data.id}</span></div>
                        <div className="flex justify-between"><span className="font-semibold text-white/60">Expires:</span> <span className="font-bold">{new Date(data.expirationDate).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="font-semibold text-white/60">Total Scans:</span> <span className="font-bold">{scanCount}</span></div>
                    </div>
                )}
                 {isError && !isSuccess && (
                     <p className="text-center mt-4 text-sm text-white/70">Please ensure the QR code is from a genuine product. If the issue persists, contact the pharmacy.</p>
                 )}
            </div>
            <button onClick={onReset} className="w-full glass-button mt-4 py-3 rounded-lg font-bold">
                Scan Another Product
            </button>
        </div>
    );
};

function VerificationPage() {
    const [scanState, setScanState] = useState('idle');
    const [verificationResult, setVerificationResult] = useState(null);
    const [backgroundEffect, setBackgroundEffect] = useState('default');
    const [isAnimating, setIsAnimating] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef(null);

    const themeClasses = {
      default: 'bg-gray-900',
      success: 'bg-gradient-to-br from-green-900/50 via-gray-900 to-gray-900',
      warning: 'bg-gradient-to-br from-yellow-900/50 via-gray-900 to-gray-900',
      error: 'bg-gradient-to-br from-red-900/60 via-gray-900 to-gray-900',
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Cleanup failed:", err));
            }
        };
    }, []);

    const triggerResultEffects = (theme) => {
        setBackgroundEffect(theme);
        setIsAnimating(true);

        const animationTimer = setTimeout(() => {
            setIsAnimating(false);
        }, 6000);
        
        const backgroundTimer = setTimeout(() => {
            setBackgroundEffect('default');
        }, 6000);

        return () => {
            clearTimeout(animationTimer);
            clearTimeout(backgroundTimer);
        };
    };

    const startScanner = (withLocation) => {
        setScanState('scanning');
        setError('');

        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(qrcodeRegionId);
        }

        const onScanSuccess = (decodedText) => {
            if (scannerRef.current.isScanning) {
                scannerRef.current.stop()
                    .then(() => {
                        setScanState('loading');
                        const code = decodedText.split('/').pop();
                        verifyCode(code, withLocation);
                    })
                    .catch(err => console.error("Error stopping scanner after success:", err));
            }
        };

        scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 10 },
            onScanSuccess,
            () => {}
        ).catch(_err => {
            setError("CAMERA ERROR: Please grant camera permissions and refresh the page.");
            setScanState('idle');
        });
    };

    const verifyCode = async (code, withLocation) => {
        try {
            const config = { headers: { 'X-Use-Location': String(withLocation) } };
            const response = await apiClient.get(`/api/verify/${code}`, config);
            setVerificationResult(response.data);
            if (response.data.warning) {
                triggerResultEffects('warning');
            } else {
                triggerResultEffects('success');
            }
        } catch (err) {
            const errorText = err.response?.data?.message || 'Verification failed.';
            setVerificationResult({ status: 'error', message: errorText });
            triggerResultEffects('error');
        } finally {
            setScanState('result');
        }
    };

    const resetScanner = () => {
        setVerificationResult(null);
        setError('');
        setScanState('idle');
        setBackgroundEffect('default');
        setIsAnimating(false);
    };

    return (
        <div className={`min-h-screen w-full relative flex items-center justify-center p-4 transition-all duration-1000 ${themeClasses[backgroundEffect]}`}>
            <NodeBackground theme={backgroundEffect} />
            <div className="relative z-10 w-full max-w-md">
                {scanState !== 'result' ? (
                    <div className="glass-panel p-6 sm:p-8 space-y-4">
                        <h1 className="text-3xl font-bold text-center text-white">Verify Product</h1>
                        <div className="flex flex-col items-center">
                            <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg aspect-square relative">
                                <div id={qrcodeRegionId}></div>
                                {scanState === 'idle' && <ScanConsent onScan={startScanner} />}
                                {scanState === 'scanning' && (
                                    <div className="viewfinder-container">
                                        <div className="viewfinder-mask">
                                            <div className="viewfinder-box">
                                                <div className="viewfinder-corner top-left"></div>
                                                <div className="viewfinder-corner top-right"></div>
                                                <div className="viewfinder-corner bottom-left"></div>
                                                <div className="viewfinder-corner bottom-right"></div>
                                                <div className="viewfinder-laser"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {scanState === 'loading' && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60">
                                        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-white mt-4">Verifying...</p>
                                    </div>
                                )}
                            </div>
                            {scanState === 'scanning' && (
                                <button
                                    onClick={() => {
                                        if (scannerRef.current && scannerRef.current.isScanning) {
                                            scannerRef.current.stop().then(() => setScanState('idle')).catch(err => console.error("Error stopping scanner:", err));
                                        }
                                    }}
                                    className="glass-button py-2 px-6 rounded-lg text-sm font-bold mt-4"
                                >
                                    Cancel Scan
                                </button>
                            )}
                            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                        </div>
                    </div>
                ) : (
                    verificationResult && <VerificationResult result={verificationResult} onReset={resetScanner} isAnimating={isAnimating} />
                )}
            </div>
        </div>
    );
}

export default VerificationPage;