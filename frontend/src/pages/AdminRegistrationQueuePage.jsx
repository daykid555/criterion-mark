// frontend/src/pages/AdminRegistrationQueuePage.jsx
import React from 'react';
import AdminRegistrationQueue from '../components/AdminRegistrationQueue';

function AdminRegistrationQueuePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Pending Registrations</h1>
      <AdminRegistrationQueue />
    </div>
  );
}

export default AdminRegistrationQueuePage;