// frontend/src/pages/ReportPage.jsx (NEW FILE)

import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

function ReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <FiAlertTriangle size={60} className="text-yellow-400 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Report a Product</h1>
      <p className="text-lg text-white/70 mb-8 text-center">
        This feature is under construction.
      </p>
      <div className="glass-panel p-6 text-center">
        <p>Soon, you will be able to report suspected counterfeit products directly from here, helping to keep the supply chain safe for everyone.</p>
      </div>
      <Link to="/" className="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
        Back to Scanner
      </Link>
    </div>
  );
}

export default ReportPage;