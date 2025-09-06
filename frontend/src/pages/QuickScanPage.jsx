// frontend/src/pages/QuickScanPage.jsx (REPLACE THE ENTIRE FILE)

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiX, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import Modal from 'react-modal';

// --- STYLES ---
const fullScreenCameraStyle = `
  #pwa-scanner video { width: 100vw; height: 100vh; object-fit: cover; }
  #pwa-scanner > div[style*="border"] { display: none !important; }
`;

const modalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', background: 'rgba(10, 25, 47, 0.8)',
    backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem', padding: '1.5rem', width: '90%', maxWidth: '500px',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' }
};

Modal.setAppElement('#root');

function QuickScanPage() {
  const navigate = useNavigate();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  
  // --- NEW STATE TO PREVENT RAPID-FIRE SCANS ---
  const [isProcessing, setIsProcessing] = useState(false);

  const html5QrCodeRef = useRef(null);
  
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('scanHistory');
      if (savedHistory) setScanHistory(JSON.parse(savedHistory));
    } catch (error) { console.error("Could not load scan history:", error); }
  }, []);

  const toggleFlash = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
        const newFlashState = !isFlashOn;
        try {
            const stream = await html5QrCodeRef.current.getRunningTrackCameraCapabilities();
            const track = stream.track;
            if (track.getCapabilities().torch) {
                await track.applyConstraints({ advanced: [{ torch: newFlashState }] });
                setIsFlashOn(newFlashState);
            } else {
                toast.error("Flashlight not available.");
            }
        } catch (err) {
            console.error("Flash toggle failed:", err);
            toast.error("Could not control flashlight.");
        }
    }
  }, [isFlashOn]);

  const onScanSuccess = useCallback((decodedText) => {
    // --- THIS IS THE FIX ---
    // If we are already processing a code, ignore all new scans.
    if (isProcessing) {
      return;
    }

    // Lock the scanner immediately.
    setIsProcessing(true);
    
    toast.loading('Verifying code...');

    apiClient.get(`/api/verify/${decodedText}`)
      .then(response => {
        toast.dismiss();
        const result = { success: true, ...response.data, scannedAt: new Date().toISOString() };
        toast.success(
          <div className='text-center'>
            <p className='font-bold'>{result.message}</p>
            <p className='text-sm'>{result.data.batch.drugName}</p>
          </div>,
          { icon: <FiCheckCircle size={24} className="text-green-400" /> }
        );
        const newHistory = [result, ...scanHistory.slice(0, 19)];
        setScanHistory(newHistory);
        localStorage.setItem('scanHistory', JSON.stringify(newHistory));
      })
      .catch(error => {
        toast.dismiss();
        const result = { success: false, ...error.response?.data, scannedAt: new Date().toISOString() };
        toast.error(
          <div className='text-center'>
            <p className='font-bold'>{result.message || 'Verification failed.'}</p>
          </div>,
          { icon: <FiXCircle size={24} className="text-red-400" /> }
        );
        const newHistory = [result, ...scanHistory.slice(0, 19)];
        setScanHistory(newHistory);
        localStorage.setItem('scanHistory', JSON.stringify(newHistory));
      });
      // NO automatic rescan. The user will tap to resume.
  }, [isProcessing, scanHistory]);
  
  // --- NEW FUNCTION TO RESUME SCANNING ON USER TAP ---
  const handleResumeScan = () => {
    if (html5QrCodeRef.current && !html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.resume();
    }
    setIsProcessing(false); // Unlock the scanner
  };
  
  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("pwa-scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, (errorMessage) => {})
    .catch(err => toast.error('Could not start camera. Please grant permission.'));
  }, [onScanSuccess]);

  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  return (
    <>
      <style>{fullScreenCameraStyle}</style>
      <div className="w-screen h-screen bg-black relative overflow-hidden">
        <div id="pwa-scanner" className="absolute inset-0"></div>
        
        {/* The UI Overlay sits on top */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between items-center p-6 pointer-events-none">
          <div className="w-full flex justify-between items-center pointer-events-auto">
            <button onClick={() => navigate('/')} className="p-3"><FiX size={28} color="white" /></button>
            <button onClick={toggleFlash} className={`p-3 rounded-full transition-colors ${isFlashOn ? 'bg-white text-black' : 'bg-black/40 text-white'}`}><FiZap size={24} /></button>
          </div>
          <div className="w-full flex flex-col items-center pointer-events-auto">
            <div className="w-20 h-20 rounded-full bg-white/30 p-1 backdrop-blur-sm"><div className="w-full h-full rounded-full bg-white"></div></div>
            <div className="flex justify-center gap-8 mt-4">
              <button onClick={() => setIsHistoryVisible(true)} className="text-white/80 font-semibold text-lg">HISTORY</button>
              <button onClick={() => navigate('/report')} className="text-white/80 font-semibold text-lg">REPORT</button>
            </div>
          </div>
        </div>

        {/* --- NEW OVERLAY FOR "TAP TO RESCAN" --- */}
        {isProcessing && (
          <div 
            className="absolute inset-0 z-20 bg-black/70 flex flex-col justify-center items-center text-white cursor-pointer"
            onClick={handleResumeScan}
          >
            <FiRefreshCw size={48} className="mb-4" />
            <p className="text-2xl font-bold">Tap to Scan Again</p>
          </div>
        )}
      </div>
      
      <Modal isOpen={isHistoryVisible} onRequestClose={() => setIsHistoryVisible(false)} style={modalStyles} contentLabel="Scan History">
         {/* Modal content is unchanged */}
         <div className="text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Scan History</h2>
            <button onClick={() => setIsHistoryVisible(false)}><FiX size={24} /></button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {scanHistory.length > 0 ? scanHistory.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg flex items-start gap-4 ${item.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {item.success ? <FiCheckCircle className="text-green-400 mt-1 flex-shrink-0" size={20}/> : <FiXCircle className="text-red-400 mt-1 flex-shrink-0" size={20}/>}
                <div>
                    <p className="font-bold">{item.message}</p>
                    {item.data?.batch?.drugName && <p className="text-sm text-white/80">{item.data.batch.drugName}</p>}
                    <p className="text-xs text-white/50">{new Date(item.scannedAt).toLocaleString()}</p>
                </div>
              </div>
            )) : <p className="text-white/70">No scans recorded yet.</p>}
          </div>
        </div>
      </Modal>
    </>
  );
}

export default QuickScanPage;