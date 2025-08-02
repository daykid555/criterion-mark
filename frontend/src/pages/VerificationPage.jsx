// frontend/src/pages/VerificationPage.jsx - ACTUALLY COMPLETE CODE

import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import apiClient from '../api';
import { Link } from 'react-router-dom';

// --- LSB WATERMARK DECODING LOGIC ---
const WATERMARK_SECRET = 'CRITERION_MARK_VALID';

function extractWatermark(imageData) {
    const data = imageData.data;
    let binaryMessage = '';
    let charCode = 0;
    let bitCount = 0;

    // We only need to read enough pixels to get our secret message
    const maxPixels = (WATERMARK_SECRET.length + 1) * 8 * 4; 

    for (let i = 0; i < data.length && i < maxPixels; i += 4) {
        const bit = data[i] & 1; // Extract LSB from the red channel
        charCode = (charCode << 1) | bit;
        bitCount++;

        if (bitCount === 8) {
            if (charCode === 0) { // Null terminator found
                break;
            }
            binaryMessage += String.fromCharCode(charCode);
            charCode = 0;
            bitCount = 0;
        }
    }
    
    return binaryMessage;
}

const VerificationResult = ({ result }) => {
    if (!result) return null;

    const isSuccess = result.status === 'success';

    return (
        <div className={`fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50`}>
            <div className="glass-panel p-8 rounded-lg max-w-lg w-full text-white text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isSuccess ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                </div>
                <h2 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
                    {isSuccess ? "Product Verified" : "Verification Failed"}
                </h2>
                <p className="text-white/80 mb-6">{result.message}</p>
                {isSuccess && result.data && (
                    <div className="text-left bg-black/20 p-4 rounded-lg">
                        <p><strong>Product:</strong> {result.data.batch.drugName}</p>
                        <p><strong>Manufacturer:</strong> {result.data.batch.manufacturer.companyName}</p>
                        <p><strong>Batch Expiry:</strong> {new Date(result.data.batch.expirationDate).toLocaleDateString()}</p>
                        <p className="mt-2 text-xs font-mono text-white/50">Code: {result.data.code}</p>
                    </div>
                )}
                 <Link to="/" className="mt-8 inline-block w-full max-w-xs font-bold py-3 px-4 rounded-lg glass-button">
                    Done
                </Link>
            </div>
        </div>
    );
};


const VerificationPage = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);
    const [isConsentGiven, setIsConsentGiven] = useState(false);
    const requestRef = useRef();

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });

            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // --- STEP 1: CHECK FOR WATERMARK ---
            const watermark = extractWatermark(imageData);

            if (watermark === WATERMARK_SECRET) {
                // --- STEP 2: IF WATERMARK IS VALID, DECODE QR CODE ---
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    setIsScanning(false);
                    video.srcObject.getTracks().forEach(track => track.stop());
                    handleVerification(code.data);
                    return; // Stop the loop
                }
            }
        }
        if (isScanning) {
            requestRef.current = requestAnimationFrame(tick);
        }
    };

    const handleVerification = async (code) => {
        try {
            const response = await apiClient.get(`/api/verify/${code}`);
            setScanResult(response.data);
        } catch (err) {
            setScanResult(err.response?.data || { status: 'error', message: 'An unexpected error occurred.' });
        }
    };

    const startScan = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for the video to start playing to avoid race conditions
                videoRef.current.onloadedmetadata = () => {
                   videoRef.current.play();
                   requestRef.current = requestAnimationFrame(tick);
                };
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please grant permission and refresh the page.");
        }
    };
    
    useEffect(() => {
        if (isConsentGiven) {
            startScan();
        }
        // Cleanup function to stop the camera and animation frame
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isConsentGiven]);


    if (!isConsentGiven) {
        return (
             <div className="text-center text-white p-8">
                <h1 className="text-3xl font-bold mb-4">Camera Permission</h1>
                <p className="text-white/80 mb-8">To verify your product, we need access to your camera to scan the seal. Your camera is only used for this purpose and no images are stored.</p>
                <button onClick={() => setIsConsentGiven(true)} className="font-bold py-3 px-6 rounded-lg glass-button">
                    Grant Camera Access
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full max-w-2xl mx-auto aspect-square rounded-lg overflow-hidden glass-panel">
            {scanResult && <VerificationResult result={scanResult} />}
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-4 border-white/50 rounded-lg animate-pulse"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 text-center text-white">
                {error ? <p className="text-red-400">{error}</p> : <p>Align the seal within the box</p>}
            </div>
        </div>
    );
};

export default VerificationPage;