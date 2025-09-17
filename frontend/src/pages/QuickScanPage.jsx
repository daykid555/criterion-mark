import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import ScanResultScreen from '../components/ScanResultScreen';

// This style block ensures the camera feed fills the entire screen without extra UI from the library.
const fullScreenCameraStyle = `
  #pwa-scanner-view {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  #pwa-scanner-view video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* Hide the default QR box and messages from the library */
  #pwa-scanner-view > div {
    display: none !important;
  }
`;

// Your existing logo component, unchanged.
const CriterionMarkLogo = () => (
    <div className="flex flex-col items-center leading-none text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
      <span className="text-xs font-light tracking-widest">THE</span>
      <span className="text-3xl font-bold tracking-wider">CRITERION</span>
      <span className="text-xs font-light tracking-widest">MARK</span>
    </div>
);


function QuickScanPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(AuthContext);
    const [scanResult, setScanResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const html5QrCodeRef = useRef(null);
    const scannerContainerRef = useRef(null); // Ref for the DOM element

    // This effect handles the camera initialization and cleanup.
    useEffect(() => {
        if (!scannerContainerRef.current) {
            return;
        }

        const qrCodeInstance = new Html5Qrcode(scannerContainerRef.current.id, { verbose: false });
        html5QrCodeRef.current = qrCodeInstance;

        // Start the camera
        qrCodeInstance.start(
            { facingMode: "environment" },
            { fps: 10 },
            (decodedText) => {
                // This is the success callback, passed directly to the scanner instance
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // This is the error callback, we can ignore it for continuous scanning.
            }
        ).catch(err => {
            console.error('Camera start failed:', err);
            // You could set an error state here to show a message to the user
        });

        // Cleanup function: this is crucial to stop the camera when the component unmounts.
        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(error => {
                    console.error("Failed to stop the scanner on cleanup.", error);
                });
            }
        };
    }, []); // Empty array ensures this runs only once when the component mounts.

    const onScanSuccess = useCallback(async (decodedText) => {
        // Prevent multiple scans from being processed at once.
        if (isLoading) return;

        setIsLoading(true);
        if (html5QrCodeRef.current?.isScanning) {
            // Pause the scanner feed while we process the result.
            html5QrCodeRef.current.pause(true);
        }

        try {
            // NOTE: Location is not implemented in this UI yet. Will be added later.
            // The API call uses a hardcoded `false` for location usage for now.
            const config = { headers: { 'X-Use-Location': 'false' } };
            const response = await apiClient.get(`/api/verify/${decodedText}`, config);
            setScanResult(response.data);
        } catch (error) {
            setScanResult(error.response?.data || { status: 'error', message: 'An unknown error occurred.' });
        } finally {
            // We set loading to false in handleScanAgain when the user chooses to scan again.
        }
    }, [isLoading]);

    const handleScanAgain = () => {
        setScanResult(null);
        setIsLoading(false);
        if (html5QrCodeRef.current?.isPaused) {
            html5QrCodeRef.current.resume();
        }
    };

    const handleHistoryClick = () => {
        if (isAuthenticated) {
            navigate('/history');
        } else {
            navigate('/login');
        }
    };

    // If we have a scan result, we display the result screen.
    if (scanResult) {
        return <ScanResultScreen scanResult={scanResult} onScanAgain={handleScanAgain} />;
    }

    // This is the main immersive scanner view.
    return (
        <>
            <style>{fullScreenCameraStyle}</style>
            <div className="w-screen h-screen bg-black relative overflow-hidden">
                {/* The camera feed will be attached to this div by the library. */}
                <div id="pwa-scanner-view" ref={scannerContainerRef} />

                {/* --- UI Overlays --- */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <CriterionMarkLogo />
                </div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-full px-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleHistoryClick}
                        className="w-full max-w-sm mx-auto block bg-white/20 backdrop-blur-md text-white font-semibold py-3 px-8 rounded-full shadow-lg border border-white/30"
                    >
                        View Scan History
                    </motion.button>
                </div>
            </div>
        </>
    );
}

export default QuickScanPage;