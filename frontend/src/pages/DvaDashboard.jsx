// frontend/src/pages/DvaDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function DvaDashboard() {
  const { user } = useContext(AuthContext);

  // For DVA users, their "companyName" is their full name.
  const agentName = user?.companyName || 'DVA Portal';

  return (
    // Flex container to center the content panel vertically and horizontally
    <div className="flex items-center justify-center h-full p-4">
      
      {/* The content panel with a maximum width for better layout control */}
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center">
        
        {/* Simple, non-animated title displaying the user's name */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
          {agentName}
        </h1>

        {/* Informational text for the upcoming chat feature */}
        <p className="text-white/70 mt-6 max-w-md mx-auto">
          Welcome. This dashboard will host the secure communication channel for DVA agents. Chat functionality is pending implementation.
        </p>

      </div>
    </div>
  );
}

export default DvaDashboard;