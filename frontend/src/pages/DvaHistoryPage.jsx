// frontend/src/pages/DvaHistoryPage.jsx
import React from 'react';
import DvaHistory from '../components/DvaHistory';

function DvaHistoryPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Action History</h1>
      <DvaHistory />
    </div>
  );
}

export default DvaHistoryPage;