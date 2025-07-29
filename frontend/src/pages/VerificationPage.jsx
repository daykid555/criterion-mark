// frontend/src/pages/VerificationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api';
import NodeBackground from '../components/NodeBackground';

const qrcodeRegionId = "qr-reader";

// ... (ScanConsent component remains the same)
const ScanConsent = ({ onScan }) => ( <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-4 text-center"> <svg className="w-12 h-12 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> <h3 className="font-bold text-white mb-2">Help Secure Your Medication</h3> <p className="text-white/80 text-sm mb-6"> Scanning with location is most useful at the pharmacy to help us track counterfeit hotspots. </p> <div className="space-y-3 w-full max-w-xs"> <button onClick={() => onScan(true)} className="w-full glass-button font-bold py-3 px-6 rounded-lg"> Scan with Location </button> <button onClick={() => onScan(false)} className="w-full text-white/60 hover:text-white text-xs font-semibold"> Scan without Location </button> </div> <p className="text-yellow-300 text-xs font-semibold p-2 bg-yellow-500/20 rounded-md mt-4"> For your privacy, please use the "without location" option when scanning at home. </p> </div> );

function VerificationPage() {
  const [scanState, setScanState] = useState('idle');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Cleanup failed:", err));
      }
    };
  }, []);

  const startScanner = (withLocation) => {
    setScanState('scanning');
    setError('');
    
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(qrcodeRegionId);
    }
    
    const config = { fps: 10 }; // <-- THE JAVASCRIPT FIX IS HERE. NO MORE QRBOX.

    const onScanSuccess = (decodedText) => {
      if (scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => {
            setScanState('loading');
            verifyCode(decodedText, withLocation);
          })
          .catch(err => console.error("Error stopping scanner after success:", err));
      }
    };
    
    scannerRef.current.start(
      { facingMode: "environment" },
      config, // Use the updated config
      onScanSuccess,
      (errorMessage) => { /* Optional */ }
    ).catch(err => {
      setError("CAMERA ERROR: Please grant camera permissions and refresh the page.");
      setScanState('idle');
    });
  };

  // ... (verifyCode and resetScanner functions are unchanged)
  const verifyCode = async (code, withLocation) => { try { const config = { headers: { 'X-Use-Location': String(withLocation) } }; const response = await apiClient.get(`/api/verify/${code}`, config); setVerificationResult(response.data); } catch (err) { const errorText = err.response?.data?.message || 'Verification failed.'; setVerificationResult({ status: 'error', message: errorText }); } finally { setScanState('result'); } };
  const resetScanner = () => { setVerificationResult(null); setError(''); setScanState('idle'); };


  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      <NodeBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel p-6 sm:p-8 space-y-4">
          <h1 className="text-3xl font-bold text-center text-white">Verify Product</h1>
          
          <div className="flex flex-col items-center">
            <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg aspect-square relative">
              <div id={qrcodeRegionId}></div>
              {scanState === 'idle' && <ScanConsent onScan={startScanner} />}
            </div>

            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
            
            {scanState === 'result' && verificationResult && (
              <div className="mt-6 w-full text-center">
                <div className={`p-4 rounded-lg ${verificationResult.status === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                  <p className="font-bold">{verificationResult.message}</p>
                  {verificationResult.status === 'success' && <p className="text-xs mt-1">Product: {verificationResult.data.batch.drugName}</p>}
                </div>
                <button onClick={resetScanner} className="w-full glass-button mt-4 py-3 rounded-lg font-bold">
                  Scan Another Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;