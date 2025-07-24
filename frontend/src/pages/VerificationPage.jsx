import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';

const qrcodeRegionId = "qr-reader";

const VerificationPage = () => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    // Create a new scanner instance only if it doesn't exist.
    if (!scannerRef.current) {
      const html5QrcodeScanner = new Html5Qrcode(qrcodeRegionId);
      scannerRef.current = html5QrcodeScanner;
    }
    const scanner = scannerRef.current;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    const onScanSuccess = (decodedText, decodedResult) => {
      scanner.stop().then(() => {
        verifyCode(decodedText);
      }).catch(err => {
        console.error("Failed to stop scanner", err);
        verifyCode(decodedText);
      });
    };

    const onScanFailure = (error) => {
      // You can choose to ignore these errors.
    };

    scanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  }, []);

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
    if (isLoading) return <p className="text-center mt-4">Verifying...</p>;
    if (!verificationResult) return null;

    const { status, message, data } = verificationResult;

    if (status === 'error') {
      return <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-500/30">{message}</div>;
    }

    const { batch, scanRecords } = data;
    return (
      <div className="mt-6 p-4 bg-green-900/50 text-green-200 rounded-lg border border-green-500/30 space-y-3">
        <h3 className="font-bold text-lg">{message}</h3>
        <p><span className="font-semibold">Product:</span> {batch.drugName}</p>
        <p><span className="font-semibold">Manufacturer:</span> {batch.manufacturer.companyName}</p>
        <p><span className="font-semibold">Expires on:</span> {new Date(batch.expirationDate).toLocaleDateString()}</p>
        <p><span className="font-semibold">NAFDAC No:</span> {batch.nafdacNumber}</p>
        <p><span className="font-semibold">Total Scans:</span> {scanRecords.length}</p>
        {scanRecords.length > 1 && (
          <p className="text-yellow-300 font-bold">Warning: This product has been scanned multiple times.</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Verify Product</h1>
        <div id={qrcodeRegionId} className="w-full border-2 border-dashed border-gray-600 rounded-lg overflow-hidden"></div>
        {renderResult()}
      </div>
    </div>
  );
};

export default VerificationPage;