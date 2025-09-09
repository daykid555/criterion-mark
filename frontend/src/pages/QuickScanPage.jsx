// frontend/src/pages/QuickScanPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera, FiX, FiCheckCircle, FiXCircle, FiPlayCircle, FiFileText, FiAlertTriangle, FiRepeat, FiClock } from 'react-icons/fi';

// --- STYLES ---
const fullScreenCameraStyle = `
  #pwa-scanner-view {
    position: absolute;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
  }
  #pwa-scanner-view video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  #pwa-scanner-view > div {
    display: none !important; /* Hide the library's default UI */
  }
`;

// --- RESULT MODAL COMPONENT (SCREEN 3) ---
const ResultModal = ({ result, onScanAgain }) => {
  const navigate = useNavigate();
  const isSuccess = result.status === 'success';

  const playVideo = (e) => {
    e.stopPropagation(); // Prevent the main background click from firing too
    if (result.healthContent?.videoUrl) {
      window.open(result.healthContent.videoUrl, '_blank');
    }
  };
  
  const handleBackgroundClick = () => {
    if (result.healthContent?.videoUrl) {
       window.open(result.healthContent.videoUrl, '_blank');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col justify-end text-white"
    >
      {/* Background Image/Video Tap Area */}
      <div 
        className="absolute inset-0 bg-black bg-cover bg-center cursor-pointer"
        style={{ backgroundImage: `url(${result.data?.batch?.seal_background_url || '/default-bg.jpg'})` }}
        onClick={handleBackgroundClick}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-30 p-8 space-y-4">
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">{result.data?.batch?.drugName || 'Verification Result'}</h1>
              <p className="text-white/80 font-semibold">{result.data?.dispenseRecord?.pharmacy?.companyName || 'Verified'}</p>
            </div>
             {/* Top right buttons */}
            <div className="flex items-center gap-3">
               <button onClick={onScanAgain} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><FiRepeat size={20} /></button>
               {result.healthContent?.videoUrl && 
                 <button onClick={playVideo} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><FiPlayCircle size={20} /></button>
               }
            </div>
        </div>

        {result.healthContent?.text && (
            <p className="text-white/90 text-lg">{result.healthContent.text}</p>
        )}

        <div className="pt-4 flex items-center gap-4">
          <div className={`w-full text-center font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 ${isSuccess ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
            {isSuccess ? <FiCheckCircle /> : <FiXCircle />}
            <span>{isSuccess ? 'Genuine Product' : 'Verification Failed'}</span>
          </div>
          <button 
             onClick={() => navigate('/report')} // Placeholder for report page
             className={`w-full text-center font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors ${isSuccess ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/80 hover:bg-red-600'}`}
          >
             {isSuccess ? 'Reserve' : <><FiAlertTriangle/><span>Report</span></>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


// --- MAIN SCANNER PAGE (SCREEN 1) ---
function QuickScanPage() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const html5QrCodeRef = useRef(null);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (isLoading || scanResult) return; // Prevent multiple scans

    setIsLoading(true);
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.pause(true);
    }

    try {
      const response = await apiClient.get(`/api/verify/${decodedText}`);
      setScanResult(response.data);
    } catch (error) {
      setScanResult(error.response?.data || { status: 'error', message: 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, scanResult]);

  const handleScanAgain = () => {
    setScanResult(null);
    if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
    }
  };

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("pwa-scanner-view", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 10 }, onScanSuccess, () => {})
      .catch(err => console.error('Camera start failed:', err));
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
        {/* The Camera View */}
        <div id="pwa-scanner-view" />

        {/* Loading Spinner */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Result Modal (Screen 3) */}
        <AnimatePresence>
            {scanResult && <ResultModal result={scanResult} onScanAgain={handleScanAgain} />}
        </AnimatePresence>

        {/* Main UI Overlay (Screen 1) */}
        <AnimatePresence>
            {!scanResult && !isLoading && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex flex-col justify-end text-white bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                >
                    <div className="p-8 text-center space-y-4">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold">THE CRITERION MARK</h1>
                            <p className="text-white/80 font-semibold">Authenticity Guaranteed</p>
                        </div>
                        <p className="text-lg">Scan the QR code on your product to instantly verify its authenticity.</p>
                        <button 
                            onClick={() => navigate('/history')} // Placeholder for history page
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 font-bold py-4 px-6 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            View Scan History
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default QuickScanPage;