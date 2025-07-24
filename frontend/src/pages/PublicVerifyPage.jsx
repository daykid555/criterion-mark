import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // <-- We import the CORE CLASS, not the buggy component
import axios from 'axios';

// Add this style block at the top level of the file (after imports)
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
// This component now handles all verification results
const VerificationResult = ({ result }) => {
  const { status, message, data } = result;
  const [historyVisible, setHistoryVisible] = useState(false);
  
  // Determine styling based on how many CUSTOMER scans there are
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
      <div className="p-6 bg-red-50 border-l-4 border-red-500">
        <h3 className="text-2xl font-bold text-red-800">Verification Failed! ❌</h3>
        <p className="mt-1 text-red-700">{message}</p>
      </div>
    );
  }
  
  // If status is success, show the details
  return (
    <div className={`p-6 border-l-4 ${cardClass}`}>
      <h3 className={`text-2xl font-bold ${titleClass}`}>{title}</h3>
      {customerScans > 1 && <p className="mt-1 text-yellow-700">This product has been scanned by multiple consumers. If you are not the first consumer, be skeptical.</p>}

      <div className="mt-4 space-y-2 text-gray-700">
        <p><strong>Drug Name:</strong> {data.batch.drugName}</p>
        <p><strong>Manufacturer:</strong> {data.batch.manufacturer.companyName}</p>
        <p><strong>NAFDAC No:</strong> {data.batch.nafdacNumber}</p>
        <p><strong>Expires On:</strong> {new Date(data.batch.expirationDate).toLocaleDateString()}</p>
      </div>
      
      {/* Scan History Dropdown */}
      <div className="mt-4">
        <button 
          onClick={() => setHistoryVisible(!historyVisible)}
          className="text-blue-600 font-semibold hover:underline"
        >
          {historyVisible ? 'Hide' : 'Show'} Scan History
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

  // We use a ref to hold the scanner instance
  const html5QrCodeRef = useRef(null);

  const startScanner = () => {
    if (html5QrCodeRef.current) {
      setIsScannerActive(true);
      setScanError(null);
      html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Use the back camera
        { fps: 10 },
        (decodedText, decodedResult) => {
          // success callback
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // parse error callback (optional)
        }
      ).catch((err) => {
        setScanError("Failed to start camera. Please grant permission and ensure a camera is available.");
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
  
  const handleScanSuccess = async (decodedText) => {
    stopScanner();
      setIsLoading(true);
      setScanResult(null);
      try {
        const response = await axios.get(`http://localhost:5001/api/verify/${decodedText}`);
        setScanResult(response.data);
      } catch (err) {
        setScanResult(err.response.data);
      } finally {
        setIsLoading(false);
      }
  };

  // This useEffect hook is the core of the solution
  useEffect(() => {
    // Create the scanner instance when the component mounts
    html5QrCodeRef.current = new Html5Qrcode("qr-reader");

    // Cleanup function: this is CRITICAL to stop the camera when you leave the page
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop();
    }
  };
  }, []);

  return (
    <>
      <style>{qrReaderVideoStyle}</style>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4">
        <div className="w-full max-w-lg mt-20">
          <div className="glass-panel p-8 space-y-6">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold">Verify Your Product</h1>
              <p className="opacity-80 mt-2">Press "Start Scanning" to activate your camera.</p>
            </div>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/30" id="qr-reader-container">
              <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
            </div>
            <div className="flex space-x-4">
              <button onClick={startScanner} disabled={isScannerActive} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">Start Scanning</button>
              <button onClick={stopScanner} disabled={!isScannerActive} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">Stop Scanning</button>
            </div>
            {scanError && <p className="text-center text-red-300">{scanError}</p>}
            {isLoading && <p className="text-center text-blue-300">Verifying code...</p>}
            {scanResult && <VerificationResult result={scanResult} />}
          </div>
        </div>
      </div>
    </>
  );
}
export default PublicVerifyPage;