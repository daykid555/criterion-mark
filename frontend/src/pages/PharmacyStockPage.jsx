import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { FiCamera, FiCheck, FiShoppingBag, FiLoader, FiInfo, FiTrash2, FiXCircle, FiCameraOff, FiPackage } from 'react-icons/fi';

// --- STYLES (FINAL - Restored Size & Layering Fix) ---
const cleanCameraStyle = `
  /* The black box that contains the scanner */
  #scanner-container {
    overflow: hidden !important; /* Safety net: clips anything that might over-spill */
    position: relative;
    width: 100%;
    height: auto;
    aspect-ratio: 1; /* This ensures the box is a perfect square */
    border-radius: 0.5rem;
    background-color: #000;
  }

  /* The div the library creates */
  #scanner-container > div {
    /* This ensures the library's container doesn't get weird sizing */
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important; /* Prevents overflow from this nested div */
  }

  /* THE KEY FIX: Size and position the video to fill the container */
  #scanner-container video {
  /* This brings the video layer to the very front, above everything else inside its container */
  z-index: 10 !important;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* This is the main fix */
}

/* Aggressive cleanup to remove any overlays/borders from the library */
#scanner-container span,
#scanner-container div[style*="border"] {
  display: none !important;
}
`;

function PharmacyStockPage() {
  const [scannedProducts, setScannedProducts] = useState([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState('');
  const isPausedRef = useRef(false);
  const html5QrCodeRef = useRef(null);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (isPausedRef.current) return;
    const isAlreadyScanned = scannedProducts.some(p => p.code === decodedText);
    if (isAlreadyScanned) {
      setLastScanMessage(`Already scanned: ${decodedText}`);
      return;
    }
    isPausedRef.current = true;
    if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.pause(true);
    setLastScanMessage(`Processing: ${decodedText}`);
    const newProduct = { code: decodedText, name: 'Loading...' };
    setScannedProducts(prev => [newProduct, ...prev]);
    try {
      const response = await apiClient.get(`/api/qrcodes/details/${decodedText}`);
      const { drugName } = response.data;
      setScannedProducts(prev => prev.map(p => p.code === decodedText ? { ...p, name: drugName } : p));
      setLastScanMessage(`Added: ${drugName}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Unknown Product';
      setScannedProducts(prev => prev.map(p => p.code === decodedText ? { ...p, name: errorMessage, isError: true } : p));
      setLastScanMessage(`Error: ${errorMessage}`);
    } finally {
      setTimeout(() => {
        if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.resume();
        isPausedRef.current = false;
      }, 2000);
    }
  }, [scannedProducts]);

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    setResult(null);
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})
      .then(() => setIsScannerActive(true))
      .catch(err => setLastScanMessage('Camera permission denied.'));
  }, [onScanSuccess]);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => setIsScannerActive(false))
        .catch(err => setIsScannerActive(false));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const removeProduct = (codeToRemove) => {
    setScannedProducts(prev => prev.filter(p => p.code !== codeToRemove));
  };

  const handleBatchAction = async (actionType) => {
    if (scannedProducts.length === 0) return;
    setIsLoading(true);
    setResult(null);
    const codesToProcess = scannedProducts.map(p => p.code);
    const endpoint = actionType === 'verify' ? '/api/verify/supply-chain' : '/api/pharmacy/dispense';
    const payload = { outerCodes: codesToProcess };
    try {
      const response = await apiClient.post(endpoint, payload);
      setResult({ type: 'success', ...response.data });
      setScannedProducts([]);
    } catch (err) {
      setResult({ type: 'error', ...err.response?.data });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{cleanCameraStyle}</style>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Pharmacy Stock Management (Multi-Scan)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">1. Scan Products</h2>
            <div className="w-full aspect-square bg-black/30 relative" id="scanner-container">
              <div id="scanner" className='w-full h-full'></div>
              {isScannerActive && (
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
            </div>
            <div className="flex space-x-4">
              <button onClick={startScanner} disabled={isScannerActive} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                <FiCamera className="mr-2"/> Start Camera
              </button>
              <button onClick={stopScanner} disabled={!isScannerActive} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50 bg-red-500/20 hover:bg-red-500/40">
                <FiCameraOff className="mr-2"/> Stop Camera
              </button>
            </div>
            <p className="text-center h-5 text-white/80 font-mono text-sm">{lastScanMessage}</p>
          </div>
          <div className="glass-panel p-6 space-y-4 flex flex-col">
            <h2 className="text-xl font-bold text-white">2. Process Scanned Products ({scannedProducts.length})</h2>
            <div className="flex-grow p-3 rounded-md bg-black/30 overflow-y-auto">
              {scannedProducts.length === 0 ? (
                <p className="text-white/50 text-center pt-16">Scan products to add them here.</p>
              ) : (
                <ul className="space-y-2">
                  {scannedProducts.map(product => (
                    <li key={product.code} className="flex justify-between items-center bg-white/5 p-2 rounded">
                      <div className="flex items-center gap-3">
                        <FiPackage className={product.isError ? 'text-red-400' : 'text-cyan-300'} />
                        <div>
                          <p className={`font-semibold ${product.isError ? 'text-red-300' : 'text-white'}`}>
                            {product.name}
                          </p>
                          <p className="font-mono text-xs text-white/50">{product.code}</p>
                        </div>
                      </div>
                      <button onClick={() => removeProduct(product.code)} className="text-red-400 hover:text-red-300">
                        <FiTrash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex space-x-4">
              <button onClick={() => handleBatchAction('verify')} disabled={scannedProducts.length === 0 || isLoading} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                {isLoading ? <FiLoader className="animate-spin"/> : <FiCheck/>}
                <span className="ml-2">Verify All</span>
              </button>
              <button onClick={() => handleBatchAction('dispense')} disabled={scannedProducts.length === 0 || isLoading} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-green-500/20 hover:bg-green-500/40 disabled:opacity-50">
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