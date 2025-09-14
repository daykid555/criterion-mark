// frontend/src/pages/SkincareDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function SkincareDashboard() {
  const { user } = useContext(AuthContext);

  // Use the skincare brand's company name from the auth context.
  const companyName = user?.companyName || 'Skincare Brand Portal';

  return (
    // Flex container to center the content panel vertically and horizontally
    <div className="flex items-center justify-center h-full p-4">
      
      {/* The content panel with a maximum width for better layout control */}
      <div className="glass-panel w-full max-w-4xl p-8 sm:p-12 text-center">
        
        {/* Simple, non-animated title displaying the user's company name */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
          {companyName}
        </h1>

        {/* Informational text for the upcoming chat feature */}
        <p className="text-white/70 mt-6 max-w-md mx-auto">
          This dashboard will host the secure communication channel for your brand. Chat functionality is pending implementation.
        </p>

      </div>
    </div>
  );
}

export default SkincareDashboard;