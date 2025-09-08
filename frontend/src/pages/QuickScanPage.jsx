// frontend/src/pages/QuickScanPage.jsx

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiX, FiCheckCircle, FiXCircle, FiRefreshCw, FiPlayCircle, FiFileText } from 'react-icons/fi';

// --- STYLES ---
const fullScreenCameraStyle = `
  #pwa-scanner video {
    width: 100vw;
    height: 100vh;
    object-fit: cover;
  }
  #pwa-scanner > div { border: none !important; }
  #pwa-scanner > div > div[style*="border"] { display: none !important; }
`;

// --- NEW COMPONENT: Health Content Modal ---
const HealthContentModal = ({ content, onClose }) => {
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md text-white shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <FiFileText className="text-3xl text-cyan-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold mb-2">Health Information</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{content.text}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 px-6 py-4 flex flex-col sm:flex-row gap-3 rounded-b-2xl">
          {content.videoUrl && (
            <a
              href={content.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <FiPlayCircle />
              <span>Watch Video</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


function QuickScanPage() {
  const navigate = useNavigate();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // --- NEW STATE: To hold the fetched health content ---
  const [healthContent, setHealthContent] = useState(null);

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

  // --- UPDATED: onScanSuccess now handles healthContent ---
  const onScanSuccess = useCallback((decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setHealthContent(null); // Reset on new scan
    
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.pause();
    }
    
    const toastId = toast.loading('Verifying code...');

    apiClient.get(`/api/verify/${decodedText}`)
      .then(response => {
        toast.dismiss(toastId);
        toast.success(
          <div className='text-center'>
            <p className='font-bold'>{response.data.message}</p>
            <p className='text-sm'>{response.data.data.batch.drugName}</p>
          </div>,
          { icon: <FiCheckCircle size={24} className="text-green-400" />, duration: 4000 }
        );
        // If health content exists in the response, set it
        if (response.data.healthContent) {
          // Show the modal after the toast has had a moment to be seen
          setTimeout(() => setHealthContent(response.data.healthContent), 1000);
        }
      })
      .catch(error => {
        toast.dismiss(toastId);
        toast.error(
          <div className='text-center'>
            <p className='font-bold'>{error.response?.data?.message || 'Verification failed.'}</p>
          </div>,
          { icon: <FiXCircle size={24} className="text-red-400" />, duration: 4000 }
        );
         // If health content exists even in the error response, set it
        if (error.response?.data?.healthContent) {
           setTimeout(() => setHealthContent(error.response.data.healthContent), 1000);
        }
      });
  }, [isProcessing]);
  
  const handleResumeScan = () => {
    if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
    }
    setIsProcessing(false);
    setHealthContent(null); // Close modal when resuming
  };

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("pwa-scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})
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
      
      {/* --- RENDER THE NEW MODAL WHEN CONTENT IS AVAILABLE --- */}
      <HealthContentModal content={healthContent} onClose={handleResumeScan} />

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

        {/* This overlay appears after a scan, restoring the feature you wanted */}
        {/* Do not show the "Tap to Scan" overlay if the health modal is open */}
        {isProcessing && !healthContent && (
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