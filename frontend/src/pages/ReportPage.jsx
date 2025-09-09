// frontend/src/pages/ReportPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';

function ReportPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <header className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 mr-2">
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Report an Issue</h1>
      </header>
      
      <main className="flex flex-col items-center justify-center text-center h-[60vh]">
        <div className="glass-panel p-8 rounded-2xl max-w-md">
            <FiAlertTriangle className="text-5xl mx-auto mb-4 text-yellow-400" />
            <h2 className="text-xl font-bold mb-2">Reporting Feature Coming Soon</h2>
            <p className="text-white/70">
              This is where you will be able to report counterfeit products or issues directly.
              This functionality is currently under development.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 w-full glass-button font-bold py-3 px-6 rounded-lg"
            >
              Go Back
            </button>
        </div>
      </main>
    </div>
  );
}

export default ReportPage;