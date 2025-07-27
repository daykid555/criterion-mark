// frontend/src/pages/VerificationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import NodeBackground from '../components/NodeBackground';

const qrcodeRegionId = "qr-reader";

// --- NEW: Location Consent Modal Component ---
const LocationConsentModal = ({ onAgree, onDecline }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="glass-panel p-8 rounded-lg max-w-sm w-full mx-4 space-y-4">
      <h3 className="text-xl font-bold text-white">Location Information</h3>
      <p className="text-white/80 text-sm">
        To help ensure product authenticity and security, this app records the approximate location of each scan using your IP address.
      </p>
      <p className="text-yellow-300 text-xs font-semibold p-2 bg-yellow-500/20 rounded-md">
        For your privacy, please avoid scanning products in sensitive locations like your home. Scans are most useful at the point of purchase (e.g., pharmacy).
      </p>
      <div className="flex justify-end gap-4 pt-4">
        <button onClick={onDecline} className="text-white/70 hover:text-white font-semibold">Decline</button>
        <button onClick={onAgree} className="glass-button font-bold py-2 px-6 rounded-lg">Agree & Scan</button>
      </div>
    </div>
  </div>
);

const VerificationPage = () => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // NEW: State for the modal
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerActive) return;

    const startScanner = async () => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrcodeRegionId);
      }
      const scanner = scannerRef.current;
      const config = { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true };
      
      const onScanSuccess = (decodedText) => {
        scanner.stop().then(() => {
          setScannerActive(false);
          verifyCode(decodedText);
        });
      };
      
      try {
        await scanner.start({ facingMode: "environment" }, config, onScanSuccess);
      } catch (err) {
        console.error("Failed to start scanner", err);
        setError("Could not start camera. Please grant camera permissions.");
        setScannerActive(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [scannerActive]);

  const handleStartScanner = () => {
    setVerificationResult(null);
    setError('');
    setIsModalOpen(true); // Open the modal instead of starting directly
  };

  const handleAgreeAndScan = () => {
    setIsModalOpen(false);
    setScannerActive(true); // Start scanner only after agreement
  };

  const handleStopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => setScannerActive(false));
    }
  };

  // ... (verifyCode and renderResult functions remain the same)
  const verifyCode = async (code) => {
    setIsLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await apiClient.get(`/api/verify/${code}`);
      setVerificationResult(response.data);
    } catch (err) {
      const errorText = err.response?.data?.message || err.message || 'Verification failed.';
      setError(errorText);
      setVerificationResult({ status: 'error', message: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (isLoading) return (
      <div className="mt-4 flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-center text-blue-200 font-semibold">Verifying...</p>
      </div>
    );
    if (!verificationResult) return null;
    const { status, message, data } = verificationResult;
    if (status === 'error') {
      return (
        <div className="mt-4 p-6 glass-panel bg-red-900/60 border border-red-500/30 text-red-200 flex flex-col items-center">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6"/></svg>
          <span className="font-bold text-lg mb-1">Verification Failed</span>
          <span className="text-sm text-red-100">{message}</span>
        </div>
      );
    }
    const { batch, scanRecords } = data;
    return (
      <div className="mt-6 p-6 glass-panel bg-green-900/60 border border-green-500/30 text-green-100 flex flex-col items-center space-y-2">
        <svg className="w-10 h-10 mb-2 text-green-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>
        <span className="font-bold text-lg mb-1">{message}</span>
        <div className="w-full flex flex-col gap-1 text-sm">
          <div><span className="font-semibold">Product:</span> {batch.drugName}</div>
          <div><span className="font-semibold">Manufacturer:</span> {batch.manufacturer.companyName}</div>
          <div><span className="font-semibold">Expires on:</span> {new Date(batch.expirationDate).toLocaleDateString()}</div>
          <div><span className="font-semibold">NAFDAC No:</span> {batch.nafdacNumber}</div>
          <div><span className="font-semibold">Total Scans:</span> {scanRecords.length}</div>
        </div>
        {scanRecords.length > 1 && (
          <div className="mt-2 p-2 bg-yellow-500/20 text-yellow-200 rounded-lg border border-yellow-400/30 font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
            Warning: This product has been scanned multiple times.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      <NodeBackground />
      {/* NEW: Render the modal when it's open */}
      {isModalOpen && <LocationConsentModal onAgree={handleAgreeAndScan} onDecline={() => setIsModalOpen(false)} />}
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-6 sm:p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center">Verify Product</h1>
          
          <div className="flex flex-col items-center">
            {/* --- UI OVERHAUL --- */}
            {/* This div is now a clean, responsive container for the video feed */}
            <div id={qrcodeRegionId} className="w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              {!scannerActive && (
                 <div className="aspect-square w-full flex flex-col items-center justify-center bg-white/5 p-4">
                    <svg className="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" /></svg>
                    <p className="text-white/60 text-center">Click "Start Scanner" to begin</p>
                 </div>
              )}
            </div>
            {/* End of UI Overhaul */}
            
            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            
            <div className="flex gap-4 my-6">
              <button
                className="glass-button font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                onClick={handleStartScanner}
                disabled={scannerActive}
              >
                Start Scanner
              </button>
              <button
                className="glass-button font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                onClick={handleStopScanner}
                disabled={!scannerActive}
              >
                Stop Scanner
              </button>
            </div>

            {renderResult()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;