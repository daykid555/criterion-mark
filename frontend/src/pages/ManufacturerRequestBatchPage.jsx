// frontend/src/pages/ManufacturerRequestBatchPage.jsx
import React from 'react';
import RequestBatchForm from '../components/RequestBatchForm';

function ManufacturerRequestBatchPage() {
  // We can add a success message state here if needed
  const handleSuccess = () => {
    alert('Batch requested successfully! It is now pending approval.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Request New Batch</h1>
      <div className="glass-panel p-6 sm:p-8">
        <RequestBatchForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

export default ManufacturerRequestBatchPage;