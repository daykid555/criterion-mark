// frontend/src/pages/QuickScanPage.jsx

import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { FiCheckCircle, FiXCircle, FiPlayCircle, FiFileText, FiAlertTriangle } from 'react-icons/fi';

// --- STYLES ---
const fullScreenCameraStyle = `
  #pwa-scanner-view { position: absolute; inset: 0; width: 100vw; height: 100vh; z-index: 1; }
  #pwa-scanner-view video { width: 100%; height: 100%; object-fit: cover; }
  #pwa-scanner-view > div { display: none !important; }
`;

// --- NEW LOGO COMPONENT ---
const CriterionMarkLogo = () => (
  <div className="flex flex-col items-center leading-none text-white">
    <span className="text-sm font-light tracking-widest">THE</span>
    <span className="text-4xl font-bold tracking-wider">CRITERION</span>
    <span className="text-sm font-light tracking-widest">MARK</span>
  </div>
);

// --- RESULT MODAL (SCREEN 3) ---
const ResultModal = ({ result, onScanAgain }) => {
  const navigate = useNavigate();
  const isSuccess = result.status === 'success';

  const playVideo = (e) => {
    e.stopPropagation();
    if (result.healthContent?.videoUrl) window.open(result.healthContent.videoUrl, '_blank');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onScanAgain}
      className="absolute inset-0 z-20 flex flex-col justify-end text-white cursor-pointer"
    >
      <div 
        className="absolute inset-0 bg-black bg-cover bg-center"
        style={{ backgroundImage: result.data?.batch?.seal_background_url ? `url(${result.data.batch.seal_background_url})` : 'none' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent backdrop-blur-sm" />
      </div>
      
      <div className="relative z-30 p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{result.data?.batch?.drugName || 'Verification Result'}</h1>
              <p className="text-white/70 font-semibold">{result.data?.dispenseRecord?.pharmacy?.companyName || 'Verified'}</p>
            </div>
            <div className="flex items-center gap-2">
               {result.healthContent?.videoUrl && 
                 <button onClick={playVideo} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><FiPlayCircle size={18} /></button>
               }
               {result.healthContent?.text && 
                 <button className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><FiFileText size={18} /></button>
               }
            </div>
        </div>

        {result.healthContent?.text && (
            <p className="text-white/90 text-md leading-relaxed">{result.healthContent.text}</p>
        )}

        <div className="pt-3 flex items-center gap-3">
          <div className={`min-w-[180px] flex-grow text-center font-bold py-3 px-5 rounded-full flex items-center justify-center gap-2 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
            {isSuccess ? <FiCheckCircle /> : <FiXCircle />}
            <span>{isSuccess ? 'Genuine Product' : 'Verification Failed'}</span>
          </div>
          <button 
             onClick={() => navigate('/report')}
             className="flex-shrink-0 w-32 text-center font-bold py-3 px-5 rounded-full flex items-center justify-center gap-2 transition-colors bg-white/20 hover:bg-white/30"
          >
             <FiAlertTriangle size={16}/><span>Report</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};


// --- MAIN SCANNER PAGE (SCREEN 1) ---
function QuickScanPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const html5QrCodeRef = useRef(null);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (isLoading || scanResult) return;
    setIsLoading(true);
    if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.pause(true);

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
    if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
  };
  
  const handleHistoryClick = () => {
      if (isAuthenticated) {
          navigate('/history');
      } else {
          navigate('/login');
      }
  }

  useEffect(() => {
    const qrCodeInstance = new Html5Qrcode("pwa-scanner-view", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 10 }, onScanSuccess, () => {})
      .catch(err => console.error('Camera start failed:', err));

    return () => {
      if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.stop().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <>
      <style>{fullScreenCameraStyle}</style>
      <div className="w-screen h-screen bg-black relative overflow-hidden">
        <div id="pwa-scanner-view" />

        {isLoading && (
            <motion.div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
            </motion.div>
        )}

        <AnimatePresence>
            {scanResult && <ResultModal result={scanResult} onScanAgain={handleScanAgain} />}
        </AnimatePresence>

        <AnimatePresence>
            {!scanResult && !isLoading && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex flex-col justify-end text-white bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                >
                    <div className="p-8 text-center space-y-8">
                        <CriterionMarkLogo />
                        <button 
                            onClick={handleHistoryClick}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 font-bold py-3 px-6 rounded-full hover:bg-white/20 transition-colors"
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