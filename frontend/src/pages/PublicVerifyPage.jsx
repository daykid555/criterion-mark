import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { FiMapPin } from 'react-icons/fi';
import ScanResultScreen from '../components/ScanResultScreen'; // Your import remains the same

// --- Main Page Component ---
function PublicVerifyPage() {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locationStatus, setLocationStatus] = useState('idle');

  // This ref is used to keep track of the scanner instance
  const scannerRef = useRef(null);

  // Effect for fetching location - remains unchanged
  useEffect(() => {
    // Your location fetching logic can go here if needed, or be triggered by another event.
    // For now, it's kept separate to focus on the scanner fix.
  }, []);

  // Effect for initializing and cleaning up the QR Scanner
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', // The ID of the div element below
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10,
      },
      false // verbose = false
    );
    scannerRef.current = scanner;

    function onScanSuccess(decodedText, decodedResult) {
      // Stop scanning after a successful scan
      scanner.clear().then(() => {
        setScanResult(decodedText);
      }).catch(error => {
        console.error("Failed to clear scanner.", error);
        setScanResult(decodedText); // Still set the result even if clear fails
      });
    }

    function onScanError(errorMessage) {
      // This function is called frequently, so we don't set state here to avoid flooding.
      // You can add more robust error handling if needed.
    }

    scanner.render(onScanSuccess, onScanError);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner on unmount.", error);
        });
      }
    };
  }, []); // The empty dependency array ensures this runs only once on mount

  const LocationStatusIndicator = () => (
    <div className="flex items-center justify-center text-sm text-white/80 h-5 mt-2">
      <FiMapPin className="mr-2" />
      {locationStatus === 'fetching' && 'Getting your precise location...'}
      {locationStatus === 'success' && 'Precise location enabled'}
      {locationStatus === 'error' && 'Using approximate location (permission denied)'}
      {locationStatus === 'unavailable' && 'Using approximate location (geolocation not supported)'}
      {locationStatus === 'idle' && 'Location service idle'}
    </div>
  );

  // If scanResult is available, show ScanResultScreen
  if (scanResult) {
    return <ScanResultScreen scanResult={scanResult} onScanAgain={() => setScanResult(null)} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-animated bg-[length:400%_400%] animate-gradient p-4">
      <div className="w-full max-w-lg">
        <div className="glass-panel p-8 space-y-4">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold">Verify Your Product</h1>
            <p className="opacity-80 mt-2">Scan the QR code on your product.</p>
          </div>
          
          {/* This div is where the QR scanner will be rendered */}
          <div id="qr-reader" className="w-full rounded-lg"></div>
          
          <LocationStatusIndicator />

          {scanError && <p className="text-center text-red-300 font-semibold">{scanError}</p>}
        </div>
      </div>
    </div>
  );
}

export default PublicVerifyPage;