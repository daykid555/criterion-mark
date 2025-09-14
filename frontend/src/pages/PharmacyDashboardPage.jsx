import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckSquare, FiClock } from 'react-icons/fi'; // Icons for the dashboard

// A reusable card component for the dashboard
const DashboardCard = ({ to, icon, title, description }) => (
  <Link to={to} className="glass-panel p-6 rounded-xl block hover:bg-white/10 transition-colors">
    <div className="flex items-center text-white mb-2">
      {icon}
      <h3 className="ml-3 font-bold text-xl">{title}</h3>
    </div>
    <p className="text-white/70 text-sm">{description}</p>
  </Link>
);

function PharmacyDashboardPage() {
  // You can fetch and display real data here later (e.g., number of dispensed items)
  
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-white">Pharmacy Dashboard</h1>
      <p className="text-white/80">Welcome. Manage your stock and view your history from here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <DashboardCard 
          to="/pharmacy/stock"
          icon={<FiCheckSquare size={24} className="text-green-400" />}
          title="Stock Management"
          description="Verify incoming stock and dispense products to customers or chemists."
        />
        <DashboardCard 
          to="/pharmacy/history"
          icon={<FiClock size={24} className="text-blue-400" />}
          title="Dispense History"
          description="View a complete log of all products your pharmacy has dispensed."
        />
      </div>
    </div>
  );
}

export default PharmacyDashboardPage;