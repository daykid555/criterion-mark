import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

// You can reuse the same CSS from PublicVerifyPage for the camera view
const qrReaderVideoStyle = `
  #quick-scan-reader video {
    border-radius: 0 !important;
    object-fit: cover !important;
    width: 100vw !important;
    height: 100vh !important;
    display: block;
  }
`;

function QuickScanPage() {
  const navigate = useNavigate();
  const html5QrCodeRef = useRef(null);

  const handleScanSuccess = (decodedText) => {
    // When a scan is successful, stop the camera and redirect 
    // to the main verification page, passing the code in the state.
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().catch(console.error);
    }
    // We will need to modify the PublicVerifyPage slightly to receive this code.
    // For now, let's just navigate.
    navigate(`/verify/${decodedText}`);
  };
  
  const handleScanError = (errorMessage) => {
    // We can add more robust error handling later if needed
    console.error(errorMessage);
  };

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("quick-scan-reader");
    
    // Immediately start the scanner when the component mounts
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      handleScanSuccess,
      handleScanError
    ).catch(err => {
      console.error("Failed to start scanner on QuickScanPage:", err);
      // If scanner fails, redirect back to the home page
      navigate('/');
    });

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [navigate]);

  return (
    <>
      <style>{qrReaderVideoStyle}</style>
      <div className="fixed inset-0 bg-black">
        <div id="quick-scan-reader" className="w-screen h-screen"></div>
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-4 left-4 z-10 bg-black/50 text-white font-bold py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export default QuickScanPage;