import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiFileText, FiAlertTriangle, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import sealg from '../assets/seal6.png';

const ScanResultScreen = ({ scanResult, onScanAgain }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showImageInsteadOfVideo, setShowImageInsteadOfVideo] = useState(false); // New state for video/image toggle

  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Haptic Feedback Effect
  useEffect(() => {
    if (scanResult && scanResult.status === 'error') {
      const hapticFeedbackEnabled = JSON.parse(localStorage.getItem('hapticFeedbackEnabled') || 'false');
      if (hapticFeedbackEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]); // Vibrate for 200ms, pause 100ms, vibrate 200ms
      }
    }
  }, [scanResult]);

  // Reset video/image state when scanResult changes
  useEffect(() => {
    setIsPlaying(true);
    setVideoLoading(true);
    setVideoError(false);
    setImageLoading(true);
    setImageError(false);
    setShowImageInsteadOfVideo(false);
  }, [scanResult]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowImageInsteadOfVideo(true); // Show image when video pauses
      } else {
        videoRef.current.play();
        setShowImageInsteadOfVideo(false); // Show video when video plays
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReportClick = () => {
    navigate('/report', { state: { hideBackButton: true } });
  };

  if (!scanResult) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="glass-panel w-full max-w-md p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Scanning...</h2>
          <p>Please scan a QR code to see the result.</p>
        </div>
      </div>
    );
  }

  const isSuccess = scanResult.status === 'success';
  
  // Determine content based on scan success or failure
  const currentVideoUrl = isSuccess ? scanResult.data?.productInstructionVideoUrl : scanResult.universalWarning?.videoUrl;
  const currentImageUrl = isSuccess ? scanResult.data?.productSealImageUrl : null; // Universal warning doesn't have a specific image
  const currentText = isSuccess ? scanResult.data?.productInstructionText : scanResult.universalWarning?.text;
  const currentStatusText = isSuccess ? 'Genuine Product' : 'Warning: Counterfeit/Invalid';
  const currentModalTitle = isSuccess ? `Instructions for ${scanResult.data?.drugName || 'Product'}` : 'Warning Details';

  const showVideo = currentVideoUrl && !videoError;
  const showImage = currentImageUrl && !imageError;

  // Determine which background to show
  const backgroundVideoVisible = showVideo && !videoLoading && isPlaying && !showImageInsteadOfVideo;
  const backgroundImageVisible = (showImage && !imageLoading && (showImageInsteadOfVideo || !showVideo)) || (!showVideo && !showImage); // Show image if video is paused/not available, or if no video/image is provided, fallback to sealg

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden bg-gray-900">
      {/* Background Video */}
      {showVideo && (
        <video
          ref={videoRef}
          src={currentVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${backgroundVideoVisible ? 'opacity-100' : 'opacity-0'}`}
          onLoadStart={() => setVideoLoading(true)}
          onLoadedData={() => setVideoLoading(false)}
          onError={() => { setVideoLoading(false); setVideoError(true); setShowImageInsteadOfVideo(true); }}
        />
      )}

      {/* Background Image */}
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 ${backgroundImageVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${currentImageUrl || sealg})` }} // Fallback to sealg.png
        onLoad={() => setImageLoading(false)}
        onError={() => { setImageLoading(false); setImageError(true); }}
      />

      {/* Loading Spinner for Video/Image */}
      {(videoLoading || imageLoading) && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <FiLoader className="animate-spin text-white text-4xl" />
        </div>
      )}

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full w-full max-w-2xl p-4">
        <div className="glass-panel w-full max-w-md p-8 sm:p-12 text-center text-white">
          {/* Main Status Button */}
          <div className="status-pill rounded-full py-3 px-6 text-center font-bold text-white mb-4 relative overflow-hidden mx-auto"> {/* Added status-pill and mx-auto */}
            {isSuccess ? <FiCheckCircle className="inline-block mr-2" /> : <FiXCircle className="inline-block mr-2" />}
            {currentStatusText}
            {/* Shimmering diamond effect - CSS will be needed for animation */}
            <div className="shimmer-diamond"></div>
          </div>

          {/* Three Icon Buttons */}
          <div className="flex justify-center space-x-4 mb-8">
            {showVideo && (
              <button
                onClick={togglePlayPause}
                className="glass-icon-button p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                {isPlaying && !showImageInsteadOfVideo ? <FiPause size={24} /> : <FiPlay size={24} />}
              </button>
            )}
            {currentText && (
              <button
                onClick={() => setShowTextModal(true)}
                className="glass-icon-button p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                <FiFileText size={24} />
              </button>
            )}
            <button
              onClick={handleReportClick}
              className="glass-icon-button p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <FiAlertTriangle size={24} />
            </button>
          </div>

          {/* Scan Again Button */}
          <button
            onClick={onScanAgain}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Scan Again
          </button>
        </div>
      </div>

      {/* Text Modal */}
      <Modal isOpen={showTextModal} onClose={() => setShowTextModal(false)} title={currentModalTitle} backdropClass="frosted-modal-backdrop">
        <p className="text-white/80 whitespace-pre-wrap">{currentText}</p>
      </Modal>
    </div>
  );
};

export default ScanResultScreen;
