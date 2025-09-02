import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { FiCamera, FiCheck, FiShoppingBag, FiLoader, FiInfo, FiTrash2, FiXCircle } from 'react-icons/fi';

// Using the same clean camera style from before
const cleanCameraStyle = `
  #scanner-container { overflow: hidden; position: relative; border-radius: 0.5rem; }
  #scanner-container > div { border: none !important; }
  #scanner-container video { object-fit: cover !important; }
  #scanner-container > div > div { border: none !important; box-shadow: none !important; }
  #qr-shaded-region { display: none !important; }
`;

function PharmacyStockPage() {
  const [scannedCodes, setScannedCodes] = useState([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState('');

  let html5QrCode;

  const onScanSuccess = (decodedText) => {
    // Add code to the list only if it's not already there
    if (!scannedCodes.includes(decodedText)) {
      setScannedCodes(prev => [decodedText, ...prev]); // Add new scans to the top
      setLastScanMessage(`Added: ${decodedText}`);
    } else {
      setLastScanMessage(`Already scanned: ${decodedText}`);
    }
    // Don't stop the scanner, allowing for continuous scanning
  };

  const startScanner = () => {
    setResult(null); // Clear old results when starting a new session
    html5QrCode = new Html5Qrcode("scanner");
    html5QrCode.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, console.error)
      .then(() => setIsScannerActive(true));
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => setIsScannerActive(false));
    }
  };
  
  const removeCode = (codeToRemove) => {
    setScannedCodes(prev => prev.filter(code => code !== codeToRemove));
  };

  const handleBatchAction = async (actionType) => {
    if (scannedCodes.length === 0) return;
    setIsLoading(true);
    setResult(null);

    const endpoint = actionType === 'verify' ? '/api/verify/supply-chain' : '/api/pharmacy/dispense';
    const payload = { outerCodes: scannedCodes };

    try {
      const response = await apiClient.post(endpoint, payload);
      setResult({ type: 'success', ...response.data });
      setScannedCodes([]); // Clear the list on success
    } catch (err) {
      setResult({ type: 'error', ...err.response?.data });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop(); };
  }, []);

  return (
    <>
      <style>{cleanCameraStyle}</style>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Pharmacy Stock Management (Multi-Scan)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scanner Panel */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">1. Scan Products</h2>
            <div className="w-full aspect-square bg-black/30" id="scanner-container">
              <div id="scanner" className='w-full h-full'></div>
            </div>
            <div className="flex space-x-4">
              <button onClick={startScanner} disabled={isScannerActive} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                <FiCamera className="mr-2"/> Start Camera
              </button>
               <button onClick={stopScanner} disabled={!isScannerActive} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                <FiXCircle className="mr-2"/> Stop Camera
              </button>
            </div>
             <p className="text-center h-5 text-white/80 font-mono text-sm">{lastScanMessage}</p>
          </div>

          {/* Action Panel */}
          <div className="glass-panel p-6 space-y-4 flex flex-col">
            <h2 className="text-xl font-bold text-white">2. Process Scanned Products ({scannedCodes.length})</h2>
            <div className="flex-grow p-3 rounded-md bg-black/30 overflow-y-auto">
                {scannedCodes.length === 0 ? (
                    <p className="text-white/50 text-center pt-16">Scan products to add them here.</p>
                ) : (
                    <ul className="space-y-2">
                        {scannedCodes.map(code => (
                            <li key={code} className="flex justify-between items-center bg-white/5 p-2 rounded">
                                <span className="font-mono text-xs text-white/90">{code}</span>
                                <button onClick={() => removeCode(code)} className="text-red-400 hover:text-red-300">
                                    <FiTrash2 />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex space-x-4">
              <button onClick={() => handleBatchAction('verify')} disabled={scannedCodes.length === 0 || isLoading} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                {isLoading ? <FiLoader className="animate-spin"/> : <FiCheck/>}
                <span className="ml-2">Verify All</span>
              </button>
              <button onClick={() => handleBatchAction('dispense')} disabled={scannedCodes.length === 0 || isLoading} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-green-500/20 hover:bg-green-500/40 disabled:opacity-50">
                {isLoading ? <FiLoader className="animate-spin"/> : <FiShoppingBag/>}
                <span className="ml-2">Dispense All</span>
              </button>
            </div>

            {result && (
              <div className={`mt-4 p-4 rounded-lg text-sm ${result.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                <div className="flex items-center">
                  <FiInfo className="mr-3 text-2xl flex-shrink-0"/>
                  <div>
                    <p className="font-bold">{result.type === 'success' ? 'Success' : 'Error'}</p>
                    <p>{result.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PharmacyStockPage;