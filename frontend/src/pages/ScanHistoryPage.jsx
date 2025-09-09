// frontend/src/pages/ScanHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLoader, FiAlertTriangle, FiPlayCircle, FiFileText, FiMessageSquare, FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';

// --- Text Content Modal ---
const TextModal = ({ text, onClose }) => (
  <div 
    onClick={onClose}
    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
  >
    <div 
      onClick={(e) => e.stopPropagation()}
      className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md text-white shadow-xl p-6 cursor-default"
    >
      <div className="flex items-start gap-4">
        <FiFileText className="text-3xl text-cyan-400 mt-1 flex-shrink-0" />
        <div>
          <h2 className="text-xl font-bold mb-2">Health Information</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  </div>
);


// --- History Card Component ---
const HistoryCard = ({ item, onShowText }) => {
  const isSuccess = item.scanOutcome === 'SUCCESS';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800/50 border border-white/10 rounded-2xl overflow-hidden"
    >
      <div 
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.productImage || '/default-bg.jpg'})` }}
      />
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-2xl font-bold text-white">{item.drugName}</h3>
                <p className="text-sm text-white/60">{new Date(item.scannedAt).toLocaleString()}</p>
            </div>
            {/* Scan Result Bubbles */}
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${isSuccess ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isSuccess ? <FiCheckCircle/> : <FiXCircle/>}
                    <span>{isSuccess ? 'Genuine' : 'Failed'}</span>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-end gap-2">
           {item.healthContent?.videoUrl &&
            <a href={item.healthContent.videoUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <FiPlayCircle size={20} />
            </a>
           }
           {item.healthContent?.text &&
            <button onClick={() => onShowText(item.healthContent.text)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <FiFileText size={20} />
            </button>
           }
            <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <FiMessageSquare size={20} />
            </button>
        </div>
      </div>
    </motion.div>
  );
};


// --- Main History Page Component ---
function ScanHistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/api/user/scan-history');
        setHistory(response.data);
      } catch (err) {
        setError("Could not load your scan history. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <>
      {selectedText && <TextModal text={selectedText} onClose={() => setSelectedText(null)} />}
      <div className="bg-gray-900 min-h-screen text-white p-4">
        <header className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="p-2 mr-2">
                <FiArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Scan History</h1>
        </header>
        
        <main className="space-y-6 pb-20">
            {isLoading && (
                 <div className="text-center p-8"><FiLoader className="animate-spin text-4xl mx-auto" /></div>
            )}
            {error && (
                 <div className="text-center p-8 text-red-300 flex flex-col items-center gap-4">
                    <FiAlertTriangle className="text-4xl" />
                    <p>{error}</p>
                </div>
            )}
            {!isLoading && !error && history.length === 0 && (
                 <div className="text-center p-8 text-white/60">
                    <FiClock className="text-5xl mx-auto mb-4" />
                    <h2 className="text-xl font-bold">No Scans Yet</h2>
                    <p>Your verified products will appear here.</p>
                </div>
            )}
            {history.map(item => (
                <HistoryCard key={item.id} item={item} onShowText={setSelectedText} />
            ))}
        </main>
      </div>
    </>
  );
}

export default ScanHistoryPage;