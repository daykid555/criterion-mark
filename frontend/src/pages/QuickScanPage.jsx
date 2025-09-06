// frontend/src/pages/QuickScanPage.jsx (FINAL STABLE VERSION)

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiX, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';

// --- STYLES ---
const fullScreenCameraStyle = `
  #pwa-scanner video { width: 100vw; height: 100vh; object-fit: cover; }
  #pwa-scanner > div[style*="border"] { display: none !important; }
`;

function QuickScanPage() {
  const navigate = useNavigate();
  const [isFlashOn, setIsFlashOn] = useState(false);
  
  // --- STATE TO PREVENT RAPID-FIRE SCANS ---
  const [isProcessing, setIsProcessing] = useState(false);

  const html5QrCodeRef = useRef(null);

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
    // If we are already processing a code, ignore all subsequent scans.
    if (isProcessing) {
      return;
    }

    // Lock the scanner immediately.
    setIsProcessing(true);
    
    // Pause the camera feed to prevent it from looking frozen
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.pause();
    }
    
    toast.loading('Verifying code...');

    apiClient.get(`/api/verify/${decodedText}`)
      .then(response => {
        toast.dismiss();
        toast.success(
          <div className='text-center'>
            <p className='font-bold'>{response.data.message}</p>
            <p className='text-sm'>{response.data.data.batch.drugName}</p>
          </div>,
          { icon: <FiCheckCircle size={24} className="text-green-400" /> }
        );
      })
      .catch(error => {
        toast.dismiss();
        toast.error(
          <div className='text-center'>
            <p className='font-bold'>{error.response?.data?.message || 'Verification failed.'}</p>
          </div>,
          { icon: <FiXCircle size={24} className="text-red-400" /> }
        );
      });
      // The scanner remains paused until the user taps the screen.
  }, [isProcessing]);
  
  // --- FUNCTION TO RESUME SCANNING ON USER TAP ---
  const handleResumeScan = () => {
    if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
    }
    setIsProcessing(false); // Unlock the scanner for the next scan
  };

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("pwa-scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, (errorMessage) => {})
    .catch(err => toast.error('Could not start camera. Please grant permission.'));
  }, [onScanSuccess]);

  const stopAndGoBack = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().then(() => navigate('/')).catch(() => navigate('/'));
    } else {
        navigate('/');
    }
  }, [navigate]);

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
      <div className="w-screen h-screen bg-black relative">
        <div id="pwa-scanner" className="absolute inset-0"></div>
        
        <div className="absolute inset-0 z-10 flex flex-col justify-between items-center pointer-events-none">
          <div className="w-full flex justify-end p-6 pointer-events-auto">
            <button onClick={toggleFlash} className={`p-3 rounded-full transition-colors ${isFlashOn ? 'bg-white text-black' : 'bg-black/40 text-white'}`}><FiZap size={24} /></button>
          </div>
          <div className="w-[70vw] max-w-[350px] aspect-square border-4 border-white/50 rounded-3xl"></div>
          <div className="w-full flex justify-center items-center p-6 pointer-events-auto">
            <button onClick={stopAndGoBack} className="bg-black/40 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2"><FiX size={24} /><span>Cancel</span></button>
          </div>
        </div>

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
    </>
  );
}

export default QuickScanPage;