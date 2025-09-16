import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { FiMapPin, FiCamera } from 'react-icons/fi';
import ScanResultScreen from '../components/ScanResultScreen';
import Modal from '../components/Modal';

const qrReaderVideoStyle = `
  #qr-reader video {
    border-radius: 1rem !important;
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
`;

const CriterionMarkLogo = () => (
  <div className="flex flex-col items-center leading-none text-white">
    <span className="text-xxs font-light tracking-widest">THE</span>
    <span className="text-2xl font-bold tracking-wider">CRITERION</span>
    <span className="text-xxs font-light tracking-widest">MARK</span>
  </div>
);

function PublicVerifyPage() {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [hasUserTappedToStart, setHasUserTappedToStart] = useState(false); // To track if user initiated camera start

  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationStatus, setLocationStatus] = useState('idle');

  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocationStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationStatus('success');
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          setLocationStatus('error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('unavailable');
    }
  }, []);

  const startScanner = () => {
    if (html5QrCodeRef.current) {
      setIsScannerActive(true);
      setScanError(null);
      setScanResult(null);
      setHasUserTappedToStart(true); // User has now tapped or camera auto-started
      html5QrCodeRef.current.start(
        { facingMode: "environment" }, { fps: 10 },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      ).catch((err) => {
        console.error('Camera start failed:', err);
        setScanError("Failed to start camera. Please grant permission and refresh.");
        setIsScannerActive(false); // Camera failed to start
        setHasUserTappedToStart(false); // Reset to allow re-tap if needed
      });
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => setIsScannerActive(false)).catch(console.error);
    }
  };
  
  const handleScanSuccess = async (decodedText) => {
    stopScanner();
    setIsLoading(true);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let apiUrl = `${apiBaseUrl}/api/verify/${decodedText}`;

    if (location.lat && location.lon) {
      apiUrl += `?lat=${location.lat}&lon=${location.lon}`;
    }

    try {
      const response = await axios.get(apiUrl);
      setScanResult(response.data);
      setShowScanResultModal(true);
    } catch (err) {
      if (err.response) {
        setScanResult(err.response.data);
        setShowScanResultModal(true);
      } else {
        setScanResult({ status: 'error', message: 'Network error or cannot connect to the server.' });
        setShowScanResultModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize scanner and attempt to start camera automatically
  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    startScanner(); // Attempt to start camera immediately

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []); // Empty dependency array to run only once on mount

  const LocationStatusIndicator = ({ isCameraActive }) => (
    <div className={`flex items-center justify-center text-white/80 h-5 mt-2 ${isCameraActive ? 'text-xs' : 'text-sm'}`}>
      <FiMapPin className="mr-2" />
      {locationStatus === 'fetching' && 'Getting your precise location...'}
      {locationStatus === 'success' && 'Precise location enabled'}
      {locationStatus === 'error' && 'Using approximate location (permission denied)'}
      {locationStatus === 'unavailable' && 'Using approximate location (geolocation not supported)'}
    </div>
  );

  const handleScanAgain = () => {
    setScanResult(null);
    setShowScanResultModal(false);
    startScanner(); // Restart scanner
  };

  return (
    <>
      <style>{qrReaderVideoStyle}</style>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4">
        <div className="w-full max-w-lg">
          <div className="glass-panel p-8 space-y-4">
            {/* Always render the qr-reader div, but control its visibility */}
            <div id="qr-reader" style={{ width: '100%', height: '100%', display: isScannerActive ? 'block' : 'none' }}></div>

            {/* Conditional rendering for camera or tap-to-start UI */}
            {!isScannerActive ? (
              <div
                className="flex flex-col items-center justify-center w-full aspect-square rounded-2xl bg-black/30 text-white cursor-pointer"
                onClick={startScanner}
              >
                <CriterionMarkLogo />
                <FiCamera size={38} className="mt-6 mb-3" />
                <h1 className="text-3xl font-bold">Tap to Start Camera</h1>
                <p className="text-sm opacity-80 mt-2">Camera is currently off.</p>
              </div>
            ) : (
              <div className="text-center text-white">
                <h1 className={`font-bold drop-shadow-lg ${isScannerActive ? 'text-2xl' : 'text-3xl'}`}>Verify Your Product</h1>
                <p className={`opacity-80 mt-2 ${isScannerActive ? 'text-sm' : ''}`}>Scanning for QR code...</p>
                {/* Removed Start/Stop buttons as camera auto-starts or is tap-to-start */}
              </div>
            )}

            <LocationStatusIndicator isCameraActive={isScannerActive} />

            {scanError && <p className="text-center text-red-300 font-semibold">{scanError}</p>}
            {isLoading && <div className="text-center text-blue-300 font-semibold">Verifying...</div>}
          </div>
        </div>
      </div>

      {/* Scan Result Modal */}
      <Modal isOpen={showScanResultModal} onClose={() => setShowScanResultModal(false)} title="Scan Result">
        {scanResult && (
          <ScanResultScreen scanResult={scanResult} onScanAgain={handleScanAgain} />
        )}
      </Modal>
    </>
  );
}

export default PublicVerifyPage;
