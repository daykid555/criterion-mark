// frontend/src/pages/QuickScanPage.jsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiCheckCircle, FiXCircle, FiPlayCircle, FiFileText } from 'react-icons/fi';

// Logo for the page title
const MyLogo = () => (
    <h1 className="text-2xl font-bold text-white tracking-widest text-center">
      criterion-mark
    </h1>
);

// Animated SVG for the tapping finger
const TappingFingerSVG = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width="80" 
        height="80"
        className="animate-[tap_1.5s_infinite_ease-in-out]"
    >
        <style>
            {`
            @keyframes tap {
                0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
                50% { transform: translateY(-10px) scale(0.9); opacity: 0.5; }
            }
            `}
        </style>
        <path 
            fill="#E2E8F0" 
            d="M50 85c-11.05 0-20-8.95-20-20v-2c0-11.05 8.95-20 20-20s20 8.95 20 20v2c0 11.05-8.95 20-20 20zm0-35c-5.52 0-10 4.48-10 10v2c0 5.52 4.48 10 10 10s10-4.48 10-10v-2c0-5.52-4.48-10-10-10z"
        />
        <path 
            fill="#E2E8F0" 
            d="M50 30c-5.52 0-10 4.48-10 10v2c0 5.52 4.48 10 10 10s10-4.48 10-10v-2c0-5.52-4.48-10-10-10z"
        />
    </svg>
);

// Health Content Modal
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
  const [healthContent, setHealthContent] = useState(null);
  const html5QrCodeRef = useRef(null);

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    setIsProcessing(false); // Reset to allow scanning
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})
    .catch(err => toast.error('Could not start camera. Please grant permission.'));
  }, []);

  const onScanSuccess = useCallback((decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setHealthContent(null);

    // Stop the scanner immediately after a successful scan
    if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
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
        if (response.data.healthContent) {
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
        if (error.response?.data?.healthContent) {
            setTimeout(() => setHealthContent(error.response.data.healthContent), 1000);
        }
      });
  }, [isProcessing]);
  
  const handleResumeScan = () => {
    startScanner();
  };
  
  // Auto-start scanner on component mount
  useEffect(() => {
    startScanner();
    return () => {
      // Cleanup: stop scanner when component unmounts
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  const toggleFlash = useCallback(async () => {
    try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities.torch) {
            await html5QrCodeRef.current.applyVideoConstraints({ advanced: [{ torch: !isFlashOn }] });
            setIsFlashOn(!isFlashOn);
        } else {
            toast.error("Flashlight not available.");
        }
    } catch (err) {
        toast.error("Could not control flashlight.");
    }
  }, [isFlashOn]);


  return (
    <>
      {/* The camera will automatically start here */}
      <div className="w-screen h-screen bg-black relative">
        {/* Main scanner container and camera view */}
        <div id="scanner" className="absolute inset-0"></div>
        
        {/* Top-right flash button */}
        <div className="absolute top-0 right-0 z-10 p-6 pointer-events-auto">
          <button onClick={toggleFlash} className={`p-3 rounded-full transition-colors ${isFlashOn ? 'bg-white text-black' : 'bg-black/40 text-white'}`}><FiZap size={24} /></button>
        </div>

        {/* This overlay appears after a scan, allowing for "Tap to Scan" */}
        {isProcessing && !healthContent && (
          <div 
            className="absolute inset-0 z-20 bg-black/70 flex flex-col justify-center items-center text-white cursor-pointer"
            onClick={handleResumeScan}
          >
            <TappingFingerSVG />
            <p className="text-2xl font-bold mt-4">Tap to Scan Again</p>
          </div>
        )}

        {/* Header with logo and 'Scan Product' text */}
        <div className="absolute top-0 left-0 w-full z-10 flex flex-col items-center pt-8 pointer-events-none">
          <MyLogo />
          <h1 className="text-white text-4xl mt-4 font-bold">Scan Product</h1>
        </div>

      </div>
      
      <HealthContentModal content={healthContent} onClose={handleResumeScan} />
    </>
  );
}

export default QuickScanPage;