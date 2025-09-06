// frontend/src/pages/QuickScanPage.jsx (NEW FILE)

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import toast from 'react-hot-toast';
import { FiCamera, FiXCircle, FiCheckCircle } from 'react-icons/fi';

const scannerContainerStyle = {
  width: '100vw',
  height: '100vh',
  position: 'relative',
  backgroundColor: '#0a192f',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1rem',
  boxSizing: 'border-box'
};

const scannerBoxStyle = {
  width: '80vw',
  maxWidth: '400px',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  borderRadius: '1rem',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  position: 'relative'
};

function QuickScanPage() {
  const [scanResult, setScanResult] = useState(null);
  const html5QrCodeRef = useRef(null);

  const onScanSuccess = useCallback((decodedText) => {
    // Prevent multiple scans of the same code in quick succession
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop();
    }
    
    toast.loading('Verifying code...');

    apiClient.get(`/api/verify/${decodedText}`)
      .then(response => {
        toast.dismiss(); // Dismiss the loading toast
        toast.success(
            <div className='text-center'>
                <p className='font-bold'>{response.data.message}</p>
                <p className='text-sm'>{response.data.data.batch.drugName}</p>
            </div>, {
            duration: 6000,
            icon: <FiCheckCircle size={24} className="text-green-400" />,
        });
        setScanResult({ success: true, data: response.data });
      })
      .catch(error => {
        toast.dismiss();
        toast.error(
            <div className='text-center'>
                <p className='font-bold'>{error.response?.data?.message || 'Verification failed.'}</p>
                <p className='text-sm'>Please try again or report this issue.</p>
            </div>, {
            duration: 6000,
            icon: <FiXCircle size={24} className="text-red-400" />,
        });
        setScanResult({ success: false, message: error.response?.data?.message });
      })
      .finally(() => {
        // Restart scanner after a delay to allow user to see result
        setTimeout(() => {
            if (!html5QrCodeRef.current?.isScanning) {
               startScanner();
            }
        }, 3000);
      });
  }, []);
  
  const startScanner = useCallback(() => {
    if (document.getElementById('pwa-scanner') === null) return;
    const qrCodeInstance = new Html5Qrcode("pwa-scanner");
    html5QrCodeRef.current = qrCodeInstance;
    qrCodeInstance.start({ facingMode: "environment" }, { fps: 5, qrbox: { width: 300, height: 300 } }, onScanSuccess, (errorMessage) => { /* ignore */ })
    .catch(err => toast.error('Could not start camera. Please grant permission.'));
  }, [onScanSuccess])


  useEffect(() => {
    startScanner();
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop();
      }
    };
  }, [startScanner]);

  return (
    <div style={scannerContainerStyle}>
      <img src="/logo.svg" alt="Criterion Mark Logo" className="w-12 h-12 absolute top-8" />
      <h1 className="text-white text-2xl font-bold mb-4">Scan Criterion Mark</h1>
      <div style={scannerBoxStyle} id="pwa-scanner-container">
        <div id="pwa-scanner" style={{ width: '100%', height: '100%' }}></div>
      </div>
      <p className="text-white/60 mt-4 text-center">Position the QR code inside the frame.</p>
    </div>
  );
}

export default QuickScanPage;