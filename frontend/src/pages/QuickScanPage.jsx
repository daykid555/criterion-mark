import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiX, FiCheckCircle, FiXCircle, FiRefreshCw, FiPlayCircle, FiFileText, FiCamera, FiCameraOff } from 'react-icons/fi';

// --- ANIMATED SVG FOR TAPPING ---
const TappingFingerSVG = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width="80" 
        height="80"
        className="animate-[tap_1.5s_infinite_ease-in-out_2s]"
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


// --- STYLES (Restored for container view) ---
const cleanCameraStyle = `
  /* The black box that contains the scanner */
  #scanner-container {
    overflow: hidden !important; /* Safety net: clips anything that might over-spill */
    position: relative;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    border-radius: 0.5rem;
    background-color: #000;
  }

  /* The div the library creates */
  #scanner-container > div {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
  }

  /* The main fix: Make video fit the container */
  #scanner-container video {
    z-index: 10 !important;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Aggressive cleanup to remove any overlays/borders from the library */
  #scanner-container span,
  #scanner-container div[style*="border"] {
    display: none !important;
  }
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
  const [healthContent, setHealthContent] = useState(null);
  const html5QrCodeRef = useRef(null);

  const toggleFlash = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      const newFlashState = !isFlashOn;
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities.torch) {
          await html5QrCodeRef.current.applyVideoConstraints({ advanced: [{ torch: newFlashState }] });
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
    if (isProcessing) return;
    setIsProcessing(true);
    setHealthContent(null);
    
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
    if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
    }
    setIsProcessing(false);
    setHealthContent(null);
  };

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) return;
    const qrCodeInstance = new Html5Qrcode("scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})
    .catch(err => toast.error('Could not start camera. Please grant permission.'));
  }, [onScanSuccess]);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => navigate('/'))
        .catch(() => navigate('/'));
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
      <style>{cleanCameraStyle}</style>
      
      <HealthContentModal content={healthContent} onClose={handleResumeScan} />

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">QuickScan: Product Verification</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">1. Scan Product</h2>
            <div className="w-full aspect-square bg-black/30" id="scanner-container">
              <div id="scanner" className='w-full h-full'></div>
            </div>
            <div className="flex space-x-4">
              <button onClick={startScanner} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                <FiCamera className="mr-2"/> Start Scan
              </button>
              <button onClick={stopScanner} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50 bg-red-500/20 hover:bg-red-500/40">
                <FiCameraOff className="mr-2"/> Stop Scan
              </button>
            </div>
          </div>
          <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">2. Results & Actions</h2>
              <div className="flex-grow flex flex-col justify-center items-center p-6 rounded-md bg-black/30 text-white/50 text-center">
                 {isProcessing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <FiRefreshCw className="text-6xl text-cyan-400 mb-4" />
                        <p className="text-lg">Processing...</p>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <TappingFingerSVG />
                        <p className="text-xl font-bold text-white">Ready to Scan</p>
                        <p className="text-sm">Point the camera at a QR code. Results will appear here.</p>
                    </div>
                 )}
              </div>
            </div>
            <div className="flex space-x-4">
               <button onClick={handleResumeScan} disabled={!isProcessing} className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg glass-button bg-green-500/20 hover:bg-green-500/40 disabled:opacity-50">
                <FiRefreshCw className="mr-2"/>
                <span className="ml-2">Tap to Scan Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuickScanPage;