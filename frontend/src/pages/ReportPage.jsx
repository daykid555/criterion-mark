// frontend/src/pages/ReportPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ReportForm from '../components/ReportForm';

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
      
      <main className="flex flex-col items-center justify-center w-full">
        <ReportForm />
      </main>
    </div>
  );
}

export default ReportPage;