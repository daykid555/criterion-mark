import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { FiGrid, FiPackage, FiXCircle, FiCheckCircle, FiLoader, FiTrash2, FiCamera, FiCameraOff } from 'react-icons/fi';

const cleanCameraStyle = `
  #scanner-container { overflow: hidden; position: relative; border-radius: 0.5rem; }
  #scanner-container > div { border: none !important; }
  #scanner-container video { object-fit: cover !important; }
  #scanner-container > div > div { border: none !important; box-shadow: none !important; }
  #qr-shaded-region { display: none !important; }
`;

function ManufacturerAssignPage() {
  const [mode, setMode] = useState('master'); // 'master' or 'child'
  const [masterCode, setMasterCode] = useState('');
  const [childCodes, setChildCodes] = useState(new Set());
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Use a ref to hold the scanner instance to prevent re-initialization on re-renders
  const html5QrCodeRef = useRef(null);

  const onScanSuccess = useCallback((decodedText) => {
    setMessage({ type: '', text: '' }); // Clear previous message on new scan
    if (mode === 'master') {
      if (!decodedText.startsWith('MASTER-')) {
        setMessage({ type: 'error', text: 'Invalid Code. Please scan a MASTER carton QR.' });
        return;
      }
      setMasterCode(decodedText);
      setMessage({ type: 'success', text: `Master Carton ready. Now scan child products.` });
      setMode('child');
    } else {
      if (!decodedText.startsWith('CHILD-')) {
        setMessage({ type: 'error', text: 'Invalid Code. Please scan a CHILD product QR.' });
        return;
      }
      setChildCodes(prev => {
        if (prev.has(decodedText)) {
          setMessage({ type: 'warn', text: `Already added: ${decodedText}` });
          return prev;
        }
        setMessage({ type: 'info', text: `Added: ${decodedText}` });
        // Create a new Set to trigger re-render
        return new Set([decodedText, ...prev]);
      });
    }
  }, [mode]);

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current) return;

    const qrCodeInstance = new Html5Qrcode("scanner");
    html5QrCodeRef.current = qrCodeInstance;

    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, (errorMessage) => { /* ignore errors */ })
      .then(() => {
        setIsScannerActive(true);
        setMessage({ type: 'info', text: 'Camera started. Scan a Master Carton QR.' });
      })
      .catch(err => {
        setMessage({ type: 'error', text: 'Failed to start camera. Please check permissions.' });
        console.error("Camera start error:", err);
      });
  }, [onScanSuccess]);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => {
          html5QrCodeRef.current = null;
          setIsScannerActive(false);
          setMessage({ type: '', text: '' });
        })
        .catch(err => console.error("Failed to stop scanner:", err));
    }
  }, []);
  
  const removeCode = (codeToRemove) => {
    setChildCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeToRemove);
      return newSet;
    });
  }

  const handleAssignment = async () => {
    if (!masterCode || childCodes.size === 0) {
      setMessage({ type: 'error', text: 'Master code and at least one child code are required.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiClient.post('/api/manufacturer/batches/assign-children', {
        masterOuterCode: masterCode,
        childOuterCodes: Array.from(childCodes), // Convert Set to Array for API
      });
      setMessage({ type: 'success', text: response.data.message });
      resetProcess();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Assignment failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetProcess = () => {
    setMasterCode('');
    setChildCodes(new Set());
    setMode('master');
    setMessage({ type: 'info', text: 'Process reset. Scan a new Master Carton QR.' });
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCodeRef.current) {
        stopScanner();
      }
    };
  }, [startScanner, stopScanner]);

  return (
    <>
      <style>{cleanCameraStyle}</style>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Assign Products to Carton</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Scanner</h2>
            <div className="w-full aspect-square bg-black/30" id="scanner-container">
              <div id="scanner" className='w-full h-full'></div>
            </div>
            <div className="flex space-x-4">
              <button onClick={isScannerActive ? stopScanner : startScanner} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button">
                {isScannerActive ? <FiCameraOff /> : <FiCamera />}
                <span className="ml-2">{isScannerActive ? 'Stop Camera' : 'Start Camera'}</span>
              </button>
            </div>
          </div>
          <div className="glass-panel p-6 space-y-4 flex flex-col">
            <h2 className="text-xl font-bold text-white">Assignment Details</h2>
            <div>
              <label className="block text-sm font-medium text-white/80">1. Master Carton QR</label>
              <div className={`flex items-center gap-2 mt-1 p-3 rounded-md ${masterCode ? 'bg-green-500/10' : 'bg-black/30'}`}>
                <FiGrid className={masterCode ? 'text-green-400' : 'text-white/50'}/>
                <span className="font-mono text-sm truncate">{masterCode || 'Awaiting master scan...'}</span>
              </div>
            </div>
            <div className="flex flex-col flex-grow">
              <label className="block text-sm font-medium text-white/80">2. Child Product QRs ({childCodes.size})</label>
              <div className="mt-1 flex-grow p-3 rounded-md bg-black/30 overflow-y-auto">
                {childCodes.size === 0 ? (
                  <p className="text-white/50 text-sm">Awaiting product scans...</p>
                ) : (
                  <ul className="space-y-1">
                    {Array.from(childCodes).map(code => (
                       <li key={code} className="flex justify-between items-center bg-white/5 p-2 rounded">
                          <span className="flex items-center gap-2 font-mono text-xs text-white/90"><FiPackage/> {code}</span>
                          <button onClick={() => removeCode(code)} className="text-red-400 hover:text-red-300"><FiTrash2 /></button>
                       </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {message.text && (
              <div className={`p-3 rounded-md text-sm font-semibold text-center ${
                message.type === 'error' ? 'bg-red-500/20 text-red-300' :
                message.type === 'success' ? 'bg-green-500/20 text-green-300' : 
                message.type === 'warn' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {message.text}
              </div>
            )}
            <div className="flex space-x-4 pt-2">
               <button onClick={handleAssignment} disabled={isLoading || !masterCode || childCodes.size === 0} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                {isLoading ? <FiLoader className="animate-spin"/> : <FiCheckCircle/>}
                <span className="ml-2">Complete</span>
              </button>
              <button onClick={resetProcess} className="w-auto flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-red-500/20 hover:bg-red-500/40">
                <FiXCircle/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ManufacturerAssignPage;