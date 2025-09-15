import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { FiMapPin } from 'react-icons/fi';
import ScanResultScreen from '../components/ScanResultScreen'; // Import ScanResultScreen

const qrReaderVideoStyle = `
  #qr-reader video {
    border-radius: 1rem !important;
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
`;

// --- Main Page Component ---
function PublicVerifyPage() {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [cameraAutoStart, setCameraAutoStart] = useState(true); // New state for camera auto-start setting
  const [hasUserTappedToStart, setHasUserTappedToStart] = useState(false); // New state for manual camera start

  // --- START: NEW STATE FOR PRECISE LOCATION ---
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle', 'fetching', 'success', 'error', 'unavailable'
  // --- END: NEW STATE FOR PRECISE LOCATION ---

  const html5QrCodeRef = useRef(null);

  // --- START: NEW EFFECT TO GET LOCATION ON PAGE LOAD ---
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for better accuracy
      );
    } else {
      setLocationStatus('unavailable');
    }
  }, []); // Empty array ensures this runs only once on component mount
  // --- END: NEW EFFECT TO GET LOCATION ON PAGE LOAD ---

  const startScanner = () => {
    if (html5QrCodeRef.current) {
      setIsScannerActive(true);
      setScanError(null);
      setScanResult(null);
      setHasUserTappedToStart(true); // Set to true when scanner starts
      html5QrCodeRef.current.start(
        { facingMode: "environment" }, { fps: 10 },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      ).catch(() => {
        setScanError("Failed to start camera. Please grant permission and refresh.");
        setIsScannerActive(false);
      });
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => setIsScannerActive(false)).catch(console.error);
    }
  };
  
  // --- START: UPDATED SCAN HANDLER TO SEND LOCATION ---
  const handleScanSuccess = async (decodedText) => {
    stopScanner();
    setIsLoading(true);
    setScanResult(null);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    let apiUrl = `${apiBaseUrl}/api/verify/${decodedText}`;

    // If we have precise coordinates, append them to the URL
    if (location.lat && location.lon) {
      apiUrl += `?lat=${location.lat}&lon=${location.lon}`;
    }

    try {
      const response = await axios.get(apiUrl);
      setScanResult(response.data); // Pass the entire response data to ScanResultScreen
    } catch (err) {
      if (err.response) {
        setScanResult(err.response.data); // Pass the error response data
      } else {
        setScanResult({ status: 'error', message: 'Network error or cannot connect to the server.' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  // --- END: UPDATED SCAN HANDLER ---

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("qr-reader");

    // Load cameraAutoStart setting from localStorage
    const storedCameraAutoStart = localStorage.getItem('cameraAutoStart');
    if (storedCameraAutoStart !== null) {
      setCameraAutoStart(JSON.parse(storedCameraAutoStart));
      // If auto-start is enabled, start the scanner immediately
      if (JSON.parse(storedCameraAutoStart)) {
        startScanner();
      }
    } else {
      // If no setting is found, default to auto-start and start scanner
      setCameraAutoStart(true);
      startScanner();
    }

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

  // Conditional rendering: Show ScanResultScreen if scanResult is available, otherwise show scanner
  if (scanResult) {
    return <ScanResultScreen scanResult={scanResult} onScanAgain={() => { setScanResult(null); startScanner(); }} />;
  }

  return (
    <>
      <style>{qrReaderVideoStyle}</style>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4">
        <div className="w-full max-w-lg">
          <div className="glass-panel p-8 space-y-4">
            {/* Conditional rendering for camera or text logo */}
            {(cameraAutoStart || hasUserTappedToStart) ? (
              <>
                <div className="text-center text-white">
                  <h1 className={`font-bold drop-shadow-lg ${isScannerActive ? 'text-2xl' : 'text-3xl'}`}>Verify Your Product</h1>
                  <p className={`opacity-80 mt-2 ${isScannerActive ? 'text-sm' : ''}`}>Press "Start Scanning" to use your camera.</p>
                </div>
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/30" id="qr-reader-container">
                  <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
                </div>
                <div className="flex space-x-4">
                  <button onClick={startScanner} disabled={isScannerActive || isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                    Start Scanning
                  </button>
                  <button onClick={stopScanner} disabled={!isScannerActive || isLoading} className="w-full font-bold py-3 px-4 rounded-lg glass-button disabled:opacity-50">
                    Stop Scanning
                  </button>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full aspect-square rounded-2xl bg-black/30 text-white cursor-pointer"
                onClick={startScanner}
              >
                <h1 className="text-3xl font-bold">Tap to Start Camera</h1>
                <p className="text-sm opacity-80 mt-2">Camera is currently off.</p>
              </div>
            )}

            <LocationStatusIndicator isCameraActive={isScannerActive} /> {/* Pass prop for conditional styling */}

            {scanError && <p className="text-center text-red-300 font-semibold">{scanError}</p>}
            {isLoading && <div className="text-center text-blue-300 font-semibold">Verifying...</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default PublicVerifyPage;
