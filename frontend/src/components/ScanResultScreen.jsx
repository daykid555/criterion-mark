import React, { useState, useRef } from 'react';
import { FiPlay, FiPause, FiFileText, FiAlertTriangle, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import sealg from '../assets/seal6.png'; // Assuming sealg.png is in src/assets

const ScanResultScreen = ({ scanResult, onScanAgain }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const videoRef = useRef(null);
  const navigate = useNavigate();

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReportClick = () => {
    navigate('/report');
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
  const product = isSuccess ? scanResult.data.batch : null;
  const healthContent = isSuccess ? scanResult.healthContent : null;
  const universalWarning = !isSuccess ? scanResult.universalWarning : null;

  const mainText = isSuccess ? product.drugName : universalWarning.text;
  const videoUrl = isSuccess ? product.productInstructionVideoUrl : universalWarning.videoUrl;
  const imageUrl = isSuccess ? product.productSealImageUrl : null; // No specific image for error state
  const modalContent = isSuccess ? product.productInstructionText : universalWarning.text;
  const modalTitle = isSuccess ? `Instructions for ${product.drugName}` : 'Warning Details';

  const showVideo = videoUrl && !videoError;
  const showImage = imageUrl && !imageError;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden">
      {/* Background Video/Image */}
      {(showVideo && !videoLoading) ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
          onClick={togglePlayPause}
          onLoadStart={() => setVideoLoading(true)}
          onLoadedData={() => setVideoLoading(false)}
          onError={() => { setVideoLoading(false); setVideoError(true); }}
        />
      ) : showImage && !imageLoading ? (
        <div
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 ${isPlaying && showVideo ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundImage: `url(${imageUrl})` }}
          onClick={showVideo ? togglePlayPause : undefined}
          onLoad={() => setImageLoading(false)}
          onError={() => { setImageLoading(false); setImageError(true); }}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-gray-900 flex items-center justify-center"
          style={{ backgroundImage: `url(${sealg})` }} // Fallback to sealg.png
        >
          {(videoLoading || imageLoading) && <FiLoader className="animate-spin text-white text-4xl" />}
          {(videoError || imageError) && !videoLoading && !imageLoading && <p className="text-white text-lg">Content failed to load.</p>}
        </div>
      )}

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full w-full max-w-2xl p-4">
        {/* Main Status Button */}
        <div className="w-full max-w-sm rounded-full py-3 px-6 text-center font-bold text-white mb-4 relative overflow-hidden">
          {isSuccess ? <FiCheckCircle className="inline-block mr-2" /> : <FiXCircle className="inline-block mr-2" />}
          {isSuccess ? 'Genuine Product' : 'Warning: Counterfeit/Invalid'}
          {/* Shimmering diamond effect - CSS will be needed for animation */}
          <div className="shimmer-diamond"></div>
        </div>

        {/* Three Icon Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          {videoUrl && (
            <button
              onClick={togglePlayPause}
              className="glass-icon-button p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
            </button>
          )}
          {(product?.productInstructionText || universalWarning?.text) && (
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

      {/* Text Modal */}
      <Modal isOpen={showTextModal} onClose={() => setShowTextModal(false)} title={modalTitle}>
        <p className="text-white/80 whitespace-pre-wrap">{modalContent}</p>
      </Modal>
    </div>
  );
};

export default ScanResultScreen;