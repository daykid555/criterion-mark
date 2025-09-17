import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import { FiMapPin } from 'react-icons/fi';
import ScanResultScreen from '../components/ScanResultScreen'; // Import ScanResultScreen

// --- Main Page Component ---
function PublicVerifyPage() {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  // --- START: NEW STATE FOR PRECISE LOCATION ---
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle', 'fetching', 'success', 'error', 'unavailable'
  // --- END: NEW STATE FOR PRECISE LOCATION ---

  useEffect(() => {
    const fetchLocation = () => {
      if (!navigator.geolocation) {
        setLocationStatus('unavailable');
        return;
      }

      setLocationStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationStatus('success');
        },
        () => {
          setLocationStatus('error');
        }
      );
    };

    fetchLocation();
  }, []);

  const handleScan = (result, error) => {
    if (!!result) {
      setScanResult(result?.text);
    }

    if (!!error) {
      // More specific error handling can be added here if needed
      if (error.name === 'NotAllowedError') {
        setScanError('Camera permission denied. Please allow camera access to scan QR codes.');
      } else {
        setScanError('Error scanning QR code. Please try again.');
      }
      console.error(error);
    }
  };

  const LocationStatusIndicator = () => (
    <div className="flex items-center justify-center text-sm text-white/80 h-5 mt-2">
      <FiMapPin className="mr-2" />
      {locationStatus === 'fetching' && 'Getting your precise location...'}
      {locationStatus === 'success' && 'Precise location enabled'}
      {locationStatus === 'error' && 'Using approximate location (permission denied)'}
      {locationStatus === 'unavailable' && 'Using approximate location (geolocation not supported)'}
    </div>
  );

  // If scanResult is available, show ScanResultScreen
  if (scanResult) {
    return <ScanResultScreen scanResult={scanResult} onScanAgain={() => setScanResult(null)} />;
  }

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4">
        <div className="w-full max-w-lg">
          <div className="glass-panel p-8 space-y-4">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold">Verify Your Product</h1>
              <p className="opacity-80 mt-2">Scan the QR code on your product.</p>
            </div>
            
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              className="w-full rounded-lg"
            />
            
            <LocationStatusIndicator />

            {scanError && <p className="text-center text-red-300 font-semibold">{scanError}</p>}
          </div>
        </div>
      </div>
    </>
  );
}

export default PublicVerifyPage;