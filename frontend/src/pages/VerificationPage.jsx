import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import NodeBackground from '../components/NodeBackground';

const qrcodeRegionId = "qr-reader";

const VerificationPage = () => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerActive) return;
    if (!scannerRef.current) {
      const html5QrcodeScanner = new Html5Qrcode(qrcodeRegionId);
      scannerRef.current = html5QrcodeScanner;
    }
    const scanner = scannerRef.current;
    setScanning(true);
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };
    const onScanSuccess = (decodedText, decodedResult) => {
      scanner.stop().then(() => {
        setScanning(false);
        setScannerActive(false);
        verifyCode(decodedText);
      }).catch(err => {
        setScanning(false);
        setScannerActive(false);
        verifyCode(decodedText);
      });
    };
    const onScanFailure = (error) => {};
    scanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => {});
      }
      setScanning(false);
    };
  }, [scannerActive]);

  const handleStartScanner = () => {
    setVerificationResult(null);
    setError('');
    setScannerActive(true);
  };
  const handleStopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => setScanning(false));
    }
    setScannerActive(false);
  };

  const verifyCode = async (code) => {
    setIsLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // This is the fix: using apiClient instead of a hardcoded localhost URL
      const response = await apiClient.get(`/api/verify/${code}`);
      setVerificationResult(response.data);
    } catch (err) {
      // This is also fixed: safer error handling to prevent the 'cannot read .data' error
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
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center mb-6">Verify Product</h1>
          <div className="flex flex-col items-center">
            <div id={qrcodeRegionId} className={`w-full max-w-xs aspect-square border-4 border-blue-400/40 bg-white/10 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 animate-pulse mb-4 overflow-hidden ${scanning ? '' : 'opacity-50'}`}></div>
            <div className="flex gap-4 mb-4">
              <button
                className="glass-button font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                onClick={handleStartScanner}
                disabled={scanning}
              >
                Start Scanner
              </button>
              <button
                className="glass-button font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                onClick={handleStopScanner}
                disabled={!scanning}
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