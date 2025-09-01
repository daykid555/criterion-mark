import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { FiGrid, FiPackage, FiXCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';

function ManufacturerAssignPage() {
  const [mode, setMode] = useState('master'); // 'master' or 'child'
  const [masterCode, setMasterCode] = useState('');
  const [childCodes, setChildCodes] = useState([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
  let html5QrCode;

  const onScanSuccess = (decodedText) => {
    if (mode === 'master') {
      if (!decodedText.startsWith('MASTER-')) {
        setMessage({ type: 'error', text: 'Invalid Code. Please scan a MASTER carton QR.' });
        return;
      }
      setMasterCode(decodedText);
      setMessage({ type: 'success', text: `Master Carton ${decodedText} scanned. Now scan child products.` });
      setMode('child'); // Automatically switch to child scanning mode
    } else { // mode is 'child'
      if (!decodedText.startsWith('CHILD-')) {
        setMessage({ type: 'error', text: 'Invalid Code. Please scan a CHILD product QR.' });
        return;
      }
      if (!childCodes.includes(decodedText)) {
        setChildCodes(prev => [...prev, decodedText]);
        setMessage({ type: 'info', text: `Product ${decodedText} added.` });
      } else {
        setMessage({ type: 'warn', text: `Product ${decodedText} has already been added.` });
      }
    }
  };

  const startScanner = () => {
    html5QrCode = new Html5Qrcode("scanner");
    html5QrCode.start({ facingMode: "environment" }, qrConfig, onScanSuccess, console.error)
      .then(() => setIsScannerActive(true));
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => setIsScannerActive(false));
    }
  };

  const handleAssignment = async () => {
    if (!masterCode || childCodes.length === 0) {
      setMessage({ type: 'error', text: 'Master code and at least one child code are required.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiClient.post('/api/manufacturer/batches/assign-children', {
        masterOuterCode: masterCode,
        childOuterCodes: childCodes,
      });
      setMessage({ type: 'success', text: response.data.message });
      resetProcess();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Assignment failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetProcess = () => {
    setMasterCode('');
    setChildCodes([]);
    setMode('master');
    if(isScannerActive) stopScanner();
  };

  useEffect(() => {
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop(); };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Assign Products to Carton</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Panel */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Scanner</h2>
          <div className="w-full aspect-square rounded-lg bg-black/30 overflow-hidden" id="scanner"></div>
          <div className="flex space-x-4">
            <button onClick={startScanner} disabled={isScannerActive} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">Start Camera</button>
            <button onClick={stopScanner} disabled={!isScannerActive} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">Stop Camera</button>
          </div>
        </div>

        {/* Assignment Panel */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Assignment Details</h2>
          <div>
            <label className="block text-sm font-medium text-white/80">1. Scan Master Carton QR</label>
            <div className="flex items-center gap-2 mt-1 p-3 rounded-md bg-black/30">
              <FiGrid className={masterCode ? 'text-green-400' : 'text-white/50'}/>
              <span className="font-mono text-sm truncate">{masterCode || 'Awaiting master scan...'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80">2. Scan Child Product QRs ({childCodes.length})</label>
            <div className="mt-1 p-3 h-48 rounded-md bg-black/30 overflow-y-auto">
              {childCodes.length === 0 ? (
                <p className="text-white/50 text-sm">Awaiting product scans...</p>
              ) : (
                <ul className="space-y-1">
                  {childCodes.map(code => (
                    <li key={code} className="flex items-center gap-2 font-mono text-xs text-white/90">
                      <FiPackage/> {code}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {message.text && (
            <div className={`p-3 rounded-md text-sm font-semibold ${
              message.type === 'error' ? 'bg-red-500/20 text-red-300' :
              message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {message.text}
            </div>
          )}
          <div className="flex space-x-4 pt-4">
             <button onClick={handleAssignment} disabled={isLoading || !masterCode || childCodes.length === 0} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
              {isLoading ? <FiLoader className="animate-spin"/> : <FiCheckCircle/>}
              <span className="ml-2">Complete Assignment</span>
            </button>
            <button onClick={resetProcess} className="w-auto flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-red-500/20 hover:bg-red-500/40">
              <FiXCircle/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManufacturerAssignPage;