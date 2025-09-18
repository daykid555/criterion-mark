import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import Modal from 'react-modal';
import { QRCodeCanvas } from 'qrcode.react';
import { FiPackage, FiXCircle, FiLoader, FiTrash2, FiCamera, FiCameraOff, FiPlusCircle, FiX } from 'react-icons/fi';

// --- STYLES (FINAL - Restored Size & Layering Fix) ---
const cleanCameraStyle = `
  /* The black box that contains the scanner */
  #scanner-container {
    overflow: hidden !important; /* Safety net: clips anything that might over-spill */
    position: relative;
    width: 100%;
    height: auto;
    aspect-ratio: 1; /* Add aspect ratio to maintain a square shape */
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

  /* THE KEY FIX: Bring the video to the front and control its size */
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

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(10, 25, 47, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    padding: '2rem',
    width: '90%',
    maxWidth: '400px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

Modal.setAppElement('#root');

function ManufacturerAssignPage() {
  const [scannedCodes, setScannedCodes] = useState(new Set());
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMasterCode, setGeneratedMasterCode] = useState(null);
  const html5QrCodeRef = useRef(null);

  const onScanSuccess = useCallback((decodedText) => {
    setMessage({ type: '', text: '' });
    setScannedCodes(prev => { // Changed setChildCodes to setScannedCodes
      if (prev.has(decodedText)) {
        setMessage({ type: 'warn', text: `Already added: ${decodedText.substring(0, 20)}...` });
        return prev;
      }
      setMessage({ type: 'info', text: `Added: ${decodedText.substring(0, 20)}...` });
      return new Set([decodedText, ...prev]);
    });
  }, []);

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})
      .then(() => setIsScannerActive(true))
      .catch(err => setMessage({ type: 'error', text: 'Failed to start camera. Check permissions.' }));
  }, [onScanSuccess]);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => setIsScannerActive(false))
        .catch(err => {
          console.error("Failed to stop scanner:", err);
          setIsScannerActive(false);
        });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Cleanup failed:", err));
      }
    };
  }, []);

  const removeCode = (codeToRemove) => {
    setScannedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeToRemove);
      return newSet;
    });
  };

  const handleGenerateMaster = async () => {
    if (scannedCodes.size === 0) {
      setMessage({ type: 'error', text: 'Please scan at least one product.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await apiClient.post('/api/manufacturer/master-codes/generate', {
        productCodes: Array.from(scannedCodes),
      });
      setMessage({ type: 'success', text: response.data.message });
      setGeneratedMasterCode(response.data.masterCode);
      setScannedCodes(new Set());
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Master Code generation failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetProcess = () => {
    setScannedCodes(new Set());
    setMessage({ type: '', text: '' });
  };

  const handlePrint = () => {
    const canvas = document.getElementById('master-qr-canvas');
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${generatedMasterCode.outerCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <>
      <style>{cleanCameraStyle}</style>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Group Products into a Master Carton</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Scanner</h2>
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
          </div>
          <div className="glass-panel p-6 space-y-4 flex flex-col">
            <h2 className="text-xl font-bold text-white">Scanned Products ({scannedCodes.size})</h2>
            <div className="mt-1 flex-grow p-3 rounded-md bg-black/30 overflow-y-auto h-64 md:h-auto">
              {scannedCodes.size === 0 ? (
                <p className="text-white/50 text-sm">Scan product QR codes to add them to the list...</p>
              ) : (
                <ul className="space-y-1">
                  {Array.from(scannedCodes).map(code => (
                      <li key={code} className="flex justify-between items-center bg-white/5 p-2 rounded">
                        <span className="flex items-center gap-2 font-mono text-xs text-white/90"><FiPackage/> {code}</span>
                        <button onClick={() => removeCode(code)} className="text-red-400 hover:text-red-300"><FiTrash2 /></button>
                      </li>
                  ))}
                </ul>
              )}
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
               <button onClick={handleGenerateMaster} disabled={isLoading || scannedCodes.size === 0} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                {isLoading ? (
                  <PillLoader text="Generating..." />
                ) : (
                  <>
                    <FiPlusCircle/>
                    <span className="ml-2">Generate Master Code</span>
                  </>
                )}
              </button>
              <button onClick={resetProcess} className="w-auto flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-red-500/20 hover:bg-red-500/40">
                <FiXCircle/>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={!!generatedMasterCode}
        onRequestClose={() => setGeneratedMasterCode(null)}
        style={modalStyles}
        contentLabel="Generated Master QR Code"
      >
        <div className="text-white text-center space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold">Master Code Generated</h2>
             <button onClick={() => setGeneratedMasterCode(null)} className="text-2xl"><FiX /></button>
          </div>
          <p className="text-white/80">Print this QR code and apply it to the master carton.</p>
          <div className="p-4 bg-white rounded-lg inline-block">
             {generatedMasterCode && (
               <QRCodeCanvas 
                 id="master-qr-canvas"
                 value={generatedMasterCode}
                 size={256}
                 level={"H"}
               />
             )}
          </div>
          <p className='font-mono text-sm break-all'>{generatedMasterCode}</p>
          <div className="flex space-x-4 pt-4">
            <button onClick={handlePrint} className="w-full font-bold py-3 px-4 rounded-lg glass-button">Print</button>
            <button onClick={() => setGeneratedMasterCode(null)} className="w-full font-bold py-3 px-4 rounded-lg glass-button bg-green-500/20">Done</button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ManufacturerAssignPage;