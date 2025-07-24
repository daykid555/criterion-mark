import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

// This style block is part of your original UI. It styles the camera view.
const qrReaderVideoStyle = `
  #qr-reader video {
    border-radius: 1rem !important;
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
`;

// --- Result Display Component ---
// This component handles the UI for verification results.
// I have not touched this component as it was functionally correct.
const VerificationResult = ({ result }) => {
  const { status, message, data } = result;
  const [historyVisible, setHistoryVisible] = useState(false);

  const customerScans = data?.scanRecords?.filter(r => r.scannedByRole === 'CUSTOMER').length || 0;
  let cardClass = 'bg-green-50 border-green-500';
  let titleClass = 'text-green-800';
  let title = 'Product Verified! ✅';

  if (customerScans > 1) {
    cardClass = 'bg-yellow-50 border-yellow-500';
    titleClass = 'text-yellow-800';
    title = 'Authentic Product, Multiple Scans ⚠️';
  }

  if (status === 'error') {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-md mt-4">
        <h3 className="text-2xl font-bold text-red-800">Verification Failed! ❌</h3>
        <p className="mt-1 text-red-700">{message}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 border-l-4 ${cardClass} rounded-lg shadow-md mt-4`}>
      <h3 className={`text-2xl font-bold ${titleClass}`}>{title}</h3>
      {customerScans > 1 && <p className="mt-1 text-yellow-700">This product has been scanned by multiple consumers. If you are not the first consumer, be skeptical.</p>}

      <div className="mt-4 space-y-2 text-gray-700">
        <p><strong>Drug Name:</strong> {data.batch.drugName}</p>
        <p><strong>Manufacturer:</strong> {data.batch.manufacturer.companyName}</p>
        <p><strong>NAFDAC No:</strong> {data.batch.nafdacNumber}</p>
        <p><strong>Expires On:</strong> {new Date(data.batch.expirationDate).toLocaleDateString()}</p>
      </div>
      
      <div className="mt-4">
        <button 
          onClick={() => setHistoryVisible(!historyVisible)}
          className="text-blue-600 font-semibold hover:underline"
        >
          {historyVisible ? 'Hide Scan History' : 'Show Scan History'}
        </button>
        {historyVisible && (
          <ul className="mt-2 space-y-2 border-t pt-2">
            {data.scanRecords.map(record => (
              <li key={record.id} className="text-sm text-gray-600">
                Scanned as <span className="font-semibold">{record.scannedByRole.replace(/_/g, ' ')}</span> on {new Date(record.scannedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


// --- Main Page Component ---
function PublicVerifyPage() {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState(null);

  const html5QrCodeRef = useRef(null);

  // All the scanner logic (start, stop) is your original, working code.
  // I have not changed it.
  const startScanner = () => {
    if (html5QrCodeRef.current) {
      setIsScannerActive(true);
      setScanError(null);
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10 },
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => { /* parse error callback */ }
      ).catch((err) => {
        setScanError("Failed to start camera. Please grant permission.");
        setIsScannerActive(false);
      });
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScannerActive(false);
      }).catch((err) => {
        console.error("Failed to stop the scanner.", err);
      });
    }
  };
  
  // ===================================================================
  // ===== THIS IS THE ONLY FUNCTIONAL CHANGE I HAVE MADE =====
  // ===================================================================
  const handleScanSuccess = async (decodedText) => {
    stopScanner();
    setIsLoading(true);
    setScanResult(null);

    // This is your fix. It reads the backend URL from the environment variables.
    // It works locally AND when deployed.
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      // The URL now correctly uses the variable.
      const response = await axios.get(`${apiBaseUrl}/api/verify/${decodedText}`);
      setScanResult(response.data);
    } catch (err) {
      // Improved error handling for network or server issues
      if (err.response) {
        setScanResult(err.response.data);
      } else {
        setScanResult({ status: 'error', message: 'Network error or cannot connect to the server.' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  // ===================================================================
  // ===================================================================

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop();
      }
    };
  }, []);

  // --- UI RESTORATION ---
  // The JSX below is from your original "before" version.
  // It includes all the correct class names for your beautiful UI.
  return (
    <>
      <style>{qrReaderVideoStyle}</style>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4">
        <div className="w-full max-w-lg">
          <div className="glass-panel p-8 space-y-6">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold">Verify Your Product</h1>
              <p className="opacity-80 mt-2">Press "Start Scanning" to activate your camera.</p>
            </div>
            
            {/* This is the container for the camera view */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/30" id="qr-reader-container">
              <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
            </div>
            
            {/* These are your styled glass buttons */}
            <div className="flex space-x-4">
              <button onClick={startScanner} disabled={isScannerActive || isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                Start Scanning
              </button>
              <button onClick={stopScanner} disabled={!isScannerActive || isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                Stop Scanning
              </button>
            </div>
            
            {/* Status Messages */}
            {scanError && <p className="text-center text-red-300 font-semibold">{scanError}</p>}
            {isLoading && (
                 <div className="text-center text-blue-300 font-semibold">Verifying...</div>
            )}
            {scanResult && <VerificationResult result={scanResult} />}
          </div>
        </div>
      </div>
    </>
  );
}

export default PublicVerifyPage;