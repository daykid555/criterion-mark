// frontend/src/pages/AdminDashboard.jsx
import React from 'react';

function AdminDashboard() {
  return (
    // Flex container to center the content panel vertically and horizontally
    <div className="flex items-center justify-center h-full p-4">
      
      {/* The content panel with a maximum width for better layout control */}
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center">
        
        {/* Simple, non-animated title displaying the correct company name */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
          Criterion Mark
        </h1>

        {/* Informational text for the upcoming chat feature */}
        <p className="text-white/70 mt-6 max-w-md mx-auto">
          This dashboard is reserved for the secure, real-time communication portal. Chat functionality is the next major feature to be implemented.
        </p>

      </div>
    </div>
  );
}

export default AdminDashboard;