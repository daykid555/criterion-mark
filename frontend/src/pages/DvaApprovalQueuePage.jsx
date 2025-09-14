// frontend/src/pages/DvaApprovalQueuePage.jsx
import React from 'react';
import DvaApprovalQueue from '../components/DvaApprovalQueue';

function DvaApprovalQueuePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Approval Queue</h1>
      <DvaApprovalQueue />
    </div>
  );
}

export default DvaApprovalQueuePage;