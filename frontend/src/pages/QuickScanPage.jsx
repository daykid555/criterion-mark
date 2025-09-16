// frontend/src/pages/QuickScanPage.jsx

import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { FiMapPin, FiMenu, FiCheckCircle, FiXCircle } from 'react-icons/fi'; // Import FiCheckCircle, FiXCircle
import ScanResultScreen from '../components/ScanResultScreen';

const fullScreenCameraStyle = `
  #pwa-scanner-view { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
  #pwa-scanner-view video { width: 100%; height: 100%; object-fit: cover; }
  #pwa-scanner-view > div { display: none !important; }
`;

const CriterionMarkLogo = () => (
  <div className="flex flex-col items-center leading-none text-white">
    <span className="text-xs font-light tracking-widest">THE</span> {/* Reduced size */}
    <span className="text-3xl font-bold tracking-wider">CRITERION</span> {/* Reduced size */}
    <span className="text-xs font-light tracking-widest">MARK</span> {/* Reduced size */}
  </div>
);

const LocationConsentModal = ({ onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm text-center p-6">
      <FiMapPin className="text-3xl text-cyan-400 mx-auto mb-4" /> {/* Reduced size */}
      <h2 className="text-xl font-bold text-white mb-2">Enable Location?</h2>
      <p className="text-white/70 mb-6">Scanning with location is most useful at the pharmacy to help us track counterfeit hotspots. For your privacy, please disable location when scanning at home.</p>
      <div className="flex flex-col gap-3">
        <button onClick={onConfirm} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Yes, Enable Location</button>
        <button onClick={onCancel} className="w-full text-white/60 hover:text-white text-sm font-semibold">No, Continue Without</button>
      </div>
    </div>
  </motion.div>
);

function QuickScanPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useContext(AuthContext); // Get user for dashboard path
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const html5QrCodeRef = useRef(null);
  const [useLocation, setUseLocation] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [uiVisible, setUiVisible] = useState(true); // Controls visibility of bottom UI elements
  const [phase, setPhase] = useState('loading'); // 'loading', 'landing', 'camera', 'scanResult'
  const [userSettings, setUserSettings] = useState({ hapticFeedbackEnabled: false, cameraAutoStartEnabled: true }); // New state for user settings
  const [showScanDetectionAnimation, setShowScanDetectionAnimation] = useState(false); // New state for animation

  // Fetch user settings for camera auto-start
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!isAuthenticated) {
        // If not authenticated, default to landing page (camera auto-start OFF)
        setPhase('landing');
        return;
      }
      try {
        const response = await apiClient.get('/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserSettings(response.data); // Set user settings
        const cameraAutoStartEnabled = response.data?.cameraAutoStartEnabled || false;
        if (cameraAutoStartEnabled) {
          setPhase('camera');
        } else {
          setPhase('landing');
        }
      } catch (err) {
        console.error('Failed to fetch user settings for QuickScan:', err);
        // Fallback to landing if settings cannot be fetched
        setPhase('landing');
      }
    };
    fetchUserSettings();
  }, [isAuthenticated, token]);

  // Effect to start/stop camera based on phase
  useEffect(() => {
    if (phase === 'camera' && !html5QrCodeRef.current) {
      const qrCodeInstance = new Html5Qrcode("pwa-scanner-view", { verbose: false });
      html5QrCodeRef.current = qrCodeInstance;
      qrCodeInstance.start({ facingMode: "environment" }, { fps: 10 }, onScanSuccess, () => {})
        .catch(err => {
          console.error('Camera start failed:', err);
          // Handle camera start failure, e.g., show an error message
          // For now, just log and potentially revert to landing
          setPhase('landing'); // Revert to landing if camera fails to start
        });
    } else if (phase !== 'camera' && html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().catch(() => {});
    }

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [phase, onScanSuccess]); // Depend on phase and onScanSuccess

  const getDashboardPath = (role) => {
    const paths = {
      ADMIN: '/admin/dashboard',
      MANUFACTURER: '/manufacturer/dashboard',
      DVA: '/dva/dashboard',
      PRINTING: '/printing/dashboard',
      LOGISTICS: '/logistics/dashboard',
      SKINCARE_BRAND: '/skincare/dashboard',
      PHARMACY: '/pharmacy/dashboard',
      HEALTH_ADVISOR: '/health-advisor/dashboard/pending',
      CUSTOMER: '/scan', // Default for customer, but we'll navigate to /scan if already there
    };
    return paths[role] || '/login';
  };

  const onScanSuccess = useCallback(async (decodedText) => {
    if (isLoading || scanResult) return;
    setIsLoading(true);
    setUiVisible(false); // Hide main UI when loading
    if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.pause(true);

    let scanOutcome = 'error'; // Default to error
    let responseData = null;

    try {
      const config = { headers: { 'X-Use-Location': String(useLocation), ...(token && { 'Authorization': `Bearer ${token}` }) } };
      const response = await apiClient.get(`/api/verify/${decodedText}`, config);
      responseData = response.data;
      scanOutcome = responseData.status; // 'success' or 'error'
    } catch (error) {
      responseData = error.response?.data || { status: 'error', message: 'An unknown error occurred.' };
      scanOutcome = 'error';
    } finally {
      setScanResult(responseData); // Set the scan result

      // --- Phase 3: Scan Detection --- 
      // Play sound
      const audio = new Audio(scanOutcome === 'success' ? '/sounds/success.mp3' : '/sounds/buzz.mp3');
      audio.play().catch(e => console.error("Error playing sound:", e));

      // Haptic feedback (if enabled)
      if (userSettings.hapticFeedbackEnabled && navigator.vibrate) { // Assuming userSettings is available
        if (scanOutcome === 'success') {
          navigator.vibrate(100); // Short vibration for success
        } else {
          navigator.vibrate([200, 100, 200]); // Pattern for fake/error
        }
      }

      // Show animation and then transition
      setShowScanDetectionAnimation(true);
      setTimeout(() => {
        setShowScanDetectionAnimation(false);
        setPhase('scanResult'); // Transition to scanResult phase
        setIsLoading(false); // End loading after transition
      }, 1000); // 1 second delay for animation/feedback
    }
  }, [isLoading, scanResult, useLocation, token, userSettings.hapticFeedbackEnabled]); // Add userSettings to dependencies

  const handleScanAgain = () => {
    setScanResult(null);
    setUiVisible(true);
    setPhase('camera'); // Go back to camera phase
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

  // Render logic based on phase
  if (phase === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'landing') {
    return (
      <div 
        className="w-full h-full flex flex-col items-center justify-center samsung-s25-gradient-bg text-white cursor-pointer"
        onClick={() => setPhase('camera')}
      >
        <CriterionMarkLogo />
        <p className="mt-8 text-lg">Tap anywhere to start camera</p>
      </div>
    );
  }

  // If phase is 'camera' or 'scanResult'
  return (
    <>
      <style>{fullScreenCameraStyle}</style>
      <div className="w-full h-full bg-black relative overflow-hidden">
        {/* Camera view */}
        <div id="pwa-scanner-view" />
        
        {/* Subtle Gradient Overlay */}
        {phase === 'camera' && (
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-black/20"></div>
        )}

        {/* Scan Detection Animation Overlay */}
        <AnimatePresence>
          {showScanDetectionAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              {scanResult?.status === 'success' ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="text-green-400"
                >
                  <FiCheckCircle size={100} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="text-red-400"
                >
                  <FiXCircle size={100} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewfinder and other overlays */}
        {phase === 'camera' && (
          <>
            <div className="viewfinder-container">
                <div className="viewfinder-mask">
                    <div className="viewfinder-box glow-effect"> {/* Added glow-effect class */}
                        <div className="viewfinder-corner top-left"></div>
                        <div className="viewfinder-corner top-right"></div>
                        <div className="viewfinder-corner bottom-left"></div>
                        <div className="viewfinder-corner bottom-right"></div>
                        <div className="viewfinder-laser"></div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
              {showConsentModal && <LocationConsentModal onConfirm={confirmLocation} onCancel={cancelLocation} />}
            </AnimatePresence>
            {isLoading && (
                <motion.div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" />
                </motion.div>
            )}
            <AnimatePresence>
                {uiVisible && !scanResult && !isLoading && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 flex flex-col justify-end text-white bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                        {/* Hamburger Menu Button - now part of AppLayout, so remove from here */}
                        {/* <div className="absolute top-4 left-4 z-30">
                            <button 
                                onClick={() => navigate(getDashboardPath(user?.role))}
                                className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
                            >
                                <FiMenu size={24} className="text-white" />
                            </button>
                        </div> */}

                        <div className="p-6 text-center space-y-4"> {/* Reduced space-y */}
                            <CriterionMarkLogo />
                            <div className="flex items-center justify-center gap-3"> {/* Reduced gap */}
                                <button onClick={handleHistoryClick} className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 font-semibold py-2 px-4 rounded-full hover:bg-white/20 transition-colors"> 
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
                                            <FiMapPin size={20} className={useLocation ? 'text-cyan-400' : 'text-white/70'} />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </>
        )}

        {/* ScanResultScreen (Phase 4) */}
        {phase === 'scanResult' && scanResult && (
            <ScanResultScreen scanResult={scanResult} onScanAgain={handleScanAgain} />
        )}
      </div>
    </>
  );
}

export default QuickScanPage;