// frontend/src/pages/AdminApprovalQueuePage.jsx
import React from 'react';
import AdminApprovalQueue from '../components/AdminApprovalQueue';

function AdminApprovalQueuePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Approval Queue</h1>
      <AdminApprovalQueue />
    </div>
  );
}

export default AdminApprovalQueuePage;