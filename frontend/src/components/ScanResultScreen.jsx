import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiFileText, FiAlertTriangle, FiCheckCircle, FiXCircle, FiLoader, FiArrowLeft, FiX } from 'react-icons/fi'; // Import FiArrowLeft, FiX
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import sealg from '../assets/seal6.png';

// Add props: cameraAutoStartEnabled, onCloseScan
const ScanResultScreen = ({ scanResult, onScanAgain, cameraAutoStartEnabled, onCloseScan }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showImageInsteadOfVideo, setShowImageInsteadOfVideo] = useState(false); // New state for video/image toggle

  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Removed Haptic Feedback Effect - now handled in QuickScanPage (Phase 3)

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

  // New: Handle "Back" button click
  const handleBackClick = () => {
    onScanAgain(); // Re-scan logic is similar to going back to camera
  };

  // New: Handle "Close" button click
  const handleCloseClick = () => {
    onCloseScan(); // Call the function passed from QuickScanPage
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
  const productInstructionVideoUrl = scanResult.data?.productInstructionVideoUrl;
  const universalWarningVideoUrl = scanResult.universalWarningVideoUrl; // From backend response
  const productSealImageUrl = scanResult.data?.productSealImageUrl;
  const universalWarningText = scanResult.universalWarningText; // From backend response
  const productInstructionText = scanResult.data?.productInstructionText;

  const currentVideoUrl = isSuccess ? productInstructionVideoUrl : universalWarningVideoUrl;
  const currentImageUrl = isSuccess ? productSealImageUrl : sealg; // Fallback to generic seal for fake/error if no specific image
  const currentText = isSuccess ? productInstructionText : universalWarningText;
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
        style={{ backgroundImage: `url(${currentImageUrl})` }} // Use currentImageUrl which handles fallback
        onLoad={() => setImageLoading(false)}
        onError={() => { setImageLoading(false); setImageError(true); }}
      />

      {/* Content Unavailable Card */}
      {!showVideo && !showImage && !videoLoading && !imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="glass-panel p-6 text-center text-white">
            <FiAlertTriangle className="text-5xl text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Content Unavailable</h2>
            <p className="text-sm text-white/70">No media found for this product.</p>
          </div>
        </div>
      )}

      {/* Loading Spinner for Video/Image */}
      {(videoLoading || imageLoading) && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <FiLoader className="animate-spin text-white text-4xl" />
        </div>
      )}

      {/* Overlay Content - Bottom Floating Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 flex flex-col items-center">
        {/* Main Status Pill */}
        <div className={`status-pill relative overflow-hidden rounded-full py-3 px-6 text-center font-bold text-white mb-4 ${isSuccess ? 'bg-green-500/30' : 'bg-red-500/30'}`}> 
          {isSuccess ? <FiCheckCircle className="inline-block mr-2" /> : <FiXCircle className="inline-block mr-2" />}
          {currentStatusText}
          <div className="shimmer-diamond"></div> 
        </div>

        {/* Three Icon Buttons */}
        <div className="flex justify-center space-x-4">
          {currentVideoUrl && (
            <button
              onClick={togglePlayPause}
              className="glass-icon-button p-3 rounded-full"
            >
              {isPlaying && !showImageInsteadOfVideo ? <FiPause size={24} /> : <FiPlay size={24} />}
            </button>
          )}
          {currentText && (
            <button
              onClick={() => setShowTextModal(true)}
              className="glass-icon-button p-3 rounded-full"
            >
              <FiFileText size={24} />
            </button>
          )}
          <button
            onClick={handleReportClick}
            className="glass-icon-button p-3 rounded-full"
          >
            <FiAlertTriangle size={24} />
          </button>
        </div>
      </div>

      {/* Phase 5: Next Actions Buttons */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2">
        <button
          onClick={onScanAgain} // Re-scan
          className="glass-button-sm px-4 py-2 rounded-full"
        >
          Re-scan
        </button>
        {!cameraAutoStartEnabled && (
          <button
            onClick={handleBackClick} // Go back to landing
            className="glass-button-sm px-4 py-2 rounded-full"
          >
            <FiArrowLeft size={20} /> Back
          </button>
        )}
        <button
          onClick={handleCloseClick} // Close scan flow
          className="glass-button-sm px-4 py-2 rounded-full"
        >
          <FiX size={20} /> Close
        </button>
      </div>

      {/* Text Modal */}
      <Modal isOpen={showTextModal} onClose={() => setShowTextModal(false)} title={currentModalTitle} backdropClass="frosted-modal-backdrop">
        <p className="text-white/80 whitespace-pre-wrap">{currentText}</p>
      </Modal>
    </div>
  );
};

export default ScanResultScreen;