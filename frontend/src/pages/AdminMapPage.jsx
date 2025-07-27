// frontend/src/pages/AdminMapPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function AdminMapPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">Scan Location Map</h1>
        <Link 
          to="/admin/dashboard" 
          className="text-white/80 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="glass-panel p-8">
        <p className="text-white/80 text-center">
          The interactive map will be displayed here. We will build this feature next.
        </p>
      </div>
    </div>
  );
}

export default AdminMapPage;