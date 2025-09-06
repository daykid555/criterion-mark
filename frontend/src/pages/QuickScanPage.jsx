// frontend/src/pages/QuickScanPage.jsx (REPLACE THE ENTIRE FILE)

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';

// --- STYLES ---

// This new CSS makes the camera feed a full-screen background
const fullScreenCameraStyle = `
  #pwa-scanner video {
    width: 100vw;
    height: 100vh;
    object-fit: cover;
  }
  #pwa-scanner > div[style*="border"] {
    display: none !important; /* Hides any residual borders from the library */
  }
`;

function QuickScanPage() {
  const navigate = useNavigate();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const html5QrCodeRef = useRef(null);

  // --- Flashlight Control Logic ---
  const toggleFlash = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        const newFlashState = !isFlashOn;
        const stream = await html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        const track = stream.track;
        
        if (track.getCapabilities().torch) {
          await track.applyConstraints({
            advanced: [{ torch: newFlashState }],
          });
          setIsFlashOn(newFlashState);
        } else {
          toast.error("Flashlight not available on this device.");
        }
      } catch (err) {
        console.error("Failed to toggle flash:", err);
        toast.error("Could not control flashlight.");
      }
    }
  }, [isFlashOn]);

  // --- Scan Success Handler ---
  const onScanSuccess = useCallback((decodedText) => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop();
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
            <p className='text-sm'>Please try again or report this issue.</p>
          </div>,
          { icon: <FiXCircle size={24} className="text-red-400" /> }
        );
      })
      .finally(() => {
        setTimeout(() => startScanner(), 3000);
      });
  }, []);
  
  // --- Start/Stop Scanner ---
  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning || document.getElementById('pwa-scanner') === null) return;

    const qrCodeInstance = new Html5Qrcode("pwa-scanner", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 250, height: 250 } }, onScanSuccess, (errorMessage) => { /* ignore */ })
    .catch(err => toast.error('Could not start camera. Please grant permission.'));
  }, [onScanSuccess]);

  const stopAndGoBack = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => navigate('/'))
        .catch(err => {
          console.error("Failed to stop scanner cleanly:", err);
          navigate('/'); // Navigate anyway
        });
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {});
      }
    };
  }, [startScanner]);

  return (
    <>
      <style>{fullScreenCameraStyle}</style>
      <div className="w-screen h-screen bg-black relative">
        {/* The scanner div is in the background */}
        <div id="pwa-scanner" className="absolute inset-0"></div>

        {/* The UI Overlay sits on top of the camera feed */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between items-center">
          
          {/* Top Bar: Flashlight */}
          <div className="w-full flex justify-end p-6">
            <button 
              onClick={toggleFlash}
              className={`p-3 rounded-full transition-colors duration-200 ${isFlashOn ? 'bg-white text-black' : 'bg-black/40 text-white'}`}
              aria-label="Toggle Flashlight"
            >
              <FiZap size={24} />
            </button>
          </div>

          {/* Center Guide */}
          <div className="w-[70vw] max-w-[350px] aspect-square border-4 border-white/50 rounded-3xl"></div>
          
          {/* Bottom Bar: Cancel Button */}
          <div className="w-full flex justify-center items-center p-6">
            <button 
              onClick={stopAndGoBack} 
              className="bg-black/40 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2"
              aria-label="Cancel Scan"
            >
              <FiX size={24} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuickScanPage;