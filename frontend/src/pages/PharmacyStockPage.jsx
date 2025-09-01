import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { FiCamera, FiCheck, FiShoppingBag, FiLoader, FiInfo } from 'react-icons/fi';

function PharmacyStockPage() {
  const [scannedCode, setScannedCode] = useState(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  let html5QrCode;

  const onScanSuccess = (decodedText) => {
    stopScanner();
    setScannedCode(decodedText);
    setResult(null); // Clear previous results
  };

  const startScanner = () => {
    html5QrCode = new Html5Qrcode("scanner");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, console.error)
      .then(() => setIsScannerActive(true));
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => setIsScannerActive(false));
    }
  };

  const handleAction = async (actionType) => {
    if (!scannedCode) return;
    setIsLoading(true);
    setResult(null);

    const endpoint = actionType === 'verify' ? '/api/verify/supply-chain' : '/api/pharmacy/dispense';

    try {
      const response = await apiClient.post(endpoint, { outerCode: scannedCode });
      setResult({ type: 'success', ...response.data });
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pharmacy Stock Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Scan Product Outer QR</h2>
          <div className="w-full aspect-square rounded-lg bg-black/30 overflow-hidden" id="scanner"></div>
          <button onClick={startScanner} disabled={isScannerActive} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
            <FiCamera className="mr-2"/> Start Camera
          </button>
        </div>

        {/* Action Panel */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Scanned Product</h2>
          <div className="p-3 rounded-md bg-black/30">
            <p className="text-white/80">Scanned Code:</p>
            <p className="font-mono text-lg text-white truncate">{scannedCode || 'No code scanned yet'}</p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button onClick={() => handleAction('verify')} disabled={!scannedCode || isLoading} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
               {isLoading ? <FiLoader className="animate-spin"/> : <FiCheck/>}
              <span className="ml-2">Verify Stock</span>
            </button>
            <button onClick={() => handleAction('dispense')} disabled={!scannedCode || isLoading} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-green-500/20 hover:bg-green-500/40 disabled:opacity-50">
              {isLoading ? <FiLoader className="animate-spin"/> : <FiShoppingBag/>}
              <span className="ml-2">Dispense Product</span>
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${result.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
              <div className="flex items-center">
                <FiInfo className="mr-3 text-2xl"/>
                <div>
                  <p className="font-bold">{result.type === 'success' ? 'Success' : 'Error'}</p>
                  <p>{result.message}</p>
                   {result.data && (
                    <div className="mt-2 text-xs opacity-80">
                      <p>{result.data.drugName} by {result.data.manufacturer}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PharmacyStockPage;