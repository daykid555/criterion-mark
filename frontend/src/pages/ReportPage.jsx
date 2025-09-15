// frontend/src/pages/ReportPage.jsx

import React from 'react';
import ReportForm from '../components/ReportForm';
import BackButton from '../components/BackButton';

function ReportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center mb-8">
          <BackButton />
          <h1 className="text-3xl sm:text-4xl font-bold text-white ml-4 drop-shadow-lg">Report an Issue</h1>
        </div>
        <ReportForm />
      </div>
    </div>
  );
}

export default ReportPage;