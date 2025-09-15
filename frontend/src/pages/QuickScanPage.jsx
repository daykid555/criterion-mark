import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { FiMapPin, FiCamera } from 'react-icons/fi';
import ScanResultScreen from '../components/ScanResultScreen';

const fullScreenCameraStyle = `
  #pwa-scanner-view { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
  #pwa-scanner-view video { width: 100%; height: 100%; object-fit: cover; }
  #pwa-scanner-view > div { display: none !important; }
`;

const CriterionMarkLogo = () => (
  <div className="flex flex-col items-center leading-none text-white">
    <span className="text-xxs font-light tracking-widest">THE</span>
    <span className="text-2xl font-bold tracking-wider">CRITERION</span>
    <span className="text-xxs font-light tracking-widest">MARK</span>
  </div>
);

const LocationConsentModal = ({ onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm text-center p-6">
      <FiMapPin className="text-4xl text-cyan-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Enable Location?</h2>
      <p className="text-white/70 mb-6">Scanning with location is most useful at the pharmacy to help us track counterfeit hotspots. For your privacy, please disable location when scanning at home.</p>
      <div className="flex flex-col gap-3">
        <button onClick={onConfirm} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Yes, Enable Location</button>
        <button onClick={onCancel} className="w-full text-white/60 hover:text-white text-sm font-semibold">No, Continue Without</button>
      </div>
    </div>
  </motion.div>
);

export default function QuickScanPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const html5QrCodeRef = useRef(null);
  const [useLocation, setUseLocation] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  // User settings from backend
  const [userSettings, setUserSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!token) {
        setSettingsLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserSettings(response.data);
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
        // Fallback to default if settings cannot be fetched
        setUserSettings({ hapticFeedbackEnabled: false, cameraAutoStartEnabled: true });
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchUserSettings();
  }, [token]);

  // Determine cameraAutoStartEnabled from fetched settings, default to true if not loaded yet
  const cameraAutoStartEnabled = userSettings ? userSettings.cameraAutoStartEnabled : true;
  const [cameraReady, setCameraReady] = useState(cameraAutoStartEnabled); // Initial state based on setting

  // Effect to initialize and control camera based on cameraReady state and settings loading
  useEffect(() => {
    if (settingsLoading) return; // Wait for settings to load

    const qrCodeInstance = new Html5Qrcode("pwa-scanner-view", { verbose: false });
    html5QrCodeRef.current = qrCodeInstance;

    if (cameraReady) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraReady, settingsLoading]); // Added settingsLoading to dependency array

  const startCamera = useCallback(() => {
    if (html5QrCodeRef.current && !html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.start({ facingMode: "environment" }, { fps: 10 }, onScanSuccess, () => {})
        .catch(err => console.error('Camera start failed:', err));
    }
  }, [onScanSuccess]);

  const stopCamera = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
  }, []);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (isLoading || scanResult) return;
    setIsLoading(true);
    setUiVisible(false); // Hide main UI when loading
    stopCamera(); // Stop camera on successful scan

    try {
      const config = { headers: { 'X-Use-Location': String(useLocation), ...(token && { 'Authorization': `Bearer ${token}` }) } };
      const response = await apiClient.get(`/api/verify/${decodedText}`, config);
      setScanResult(response.data);
    } catch (error) {
      setScanResult(error.response?.data || { status: 'error', message: 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, scanResult, useLocation, token, stopCamera]);

  const handleScanAgain = () => {
    setScanResult(null);
    setUiVisible(true);
    if (cameraAutoStartEnabled) {
      startCamera(); // Restart camera if auto-start is enabled
    } else {
      setCameraReady(false); // Go back to tap-to-start state
    }
  };
  
  const handleHistoryClick = () => {
      if (isAuthenticated) navigate('/history');
      else navigate('/login');
  };

  const handleLocationToggle = () => {
    if (!useLocation) setShowConsentModal(true);
    else setUseLocation(false);
  };
  
  const confirmLocation = () => {
    setUseLocation(true);
    setShowConsentModal(false);
  };
  
  const cancelLocation = () => {
    setShowConsentModal(false);
  };

  const handleTapToStartCamera = () => {
    if (!cameraReady && !scanResult && !isLoading) {
      setCameraReady(true);
    }
  };

  // If settings are still loading, show a loading indicator
  if (settingsLoading) {
    return (
      <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{fullScreenCameraStyle}</style>
      <div className="w-full h-full bg-black relative overflow-hidden">
        <div id="pwa-scanner-view" />
        {/* --- ADDED VIEWFINDER --- */}
        {cameraReady && (
          <div className="viewfinder-container">
              <div className="viewfinder-mask">
                  <div className="viewfinder-box">
                      <div className="viewfinder-corner top-left"></div>
                      <div className="viewfinder-corner top-right"></div>
                      <div className="viewfinder-corner bottom-left"></div>
                      <div className="viewfinder-corner bottom-right"></div>
                      <div className="viewfinder-laser"></div>
                  </div>
              </div>
          </div>
        )}
        {/* --- END VIEWFINDER --- */}
        <AnimatePresence>
          {showConsentModal && <LocationConsentModal onConfirm={confirmLocation} onCancel={cancelLocation} />}
        </AnimatePresence>
        {isLoading && (
            <motion.div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
            </motion.div>
        )}
        <AnimatePresence>
            {scanResult && <ScanResultScreen scanResult={scanResult} onScanAgain={handleScanAgain} />}
        </AnimatePresence>
        <AnimatePresence>
            {uiVisible && !scanResult && !isLoading && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className={`absolute inset-0 z-20 flex flex-col justify-end text-white bg-gradient-to-t from-black/90 via-black/40 to-transparent ${!cameraReady && !cameraAutoStartEnabled ? 'samsung-s25-gradient-bg' : ''}`}
                    onClick={!cameraAutoStartEnabled && !cameraReady ? handleTapToStartCamera : undefined} // Tap to start camera
                 >
                    {!cameraReady && !cameraAutoStartEnabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                        <CriterionMarkLogo />
                        <FiCamera size={38} className="mt-6 mb-3" />
                        <p className="text-base font-semibold">Tap anywhere to start camera</p>
                      </div>
                    )}
                    <div className="p-4 text-center space-y-4">
                        {cameraReady && <CriterionMarkLogo />}
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={handleHistoryClick} className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 font-bold py-2 px-4 rounded-full hover:bg-white/20 transition-colors">
                                Scan History
                            </button>
                            <div className="flex-shrink-0">
                                <label htmlFor="location-toggle" className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input type="checkbox" id="location-toggle" className="sr-only" checked={useLocation} onChange={handleLocationToggle} />
                                        <div className="block bg-gray-600/50 w-12 h-7 rounded-full"></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${useLocation ? 'translate-x-5 bg-cyan-400' : ''}`}></div>
                                    </div>
                                    <div className="ml-2 text-white font-medium">
                                        <FiMapPin className={useLocation ? 'text-cyan-400' : 'text-white/70'} size={20} />
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </>
  );
}
