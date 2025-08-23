// frontend/src/pages/ManufacturerDashboard.jsx
import { FiPackage, FiClock, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Placeholder Stat Card Component
const StatCard = ({ title, value, icon }) => (
  <div className="glass-panel p-6 rounded-lg">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/70">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="bg-white/10 p-3 rounded-md">
        {icon}
      </div>
    </div>
  </div>
);

function ManufacturerDashboard() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">Manufacturer Dashboard</h1>
        <Link to="/manufacturer/request-batch" className="glass-button font-bold py-2 px-5 rounded-lg mt-4 sm:mt-0">
          Request New Batch
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Batches Created" value="42" icon={<FiPackage size={24} className="text-white/80" />} />
        <StatCard title="Batches Pending Approval" value="2" icon={<FiClock size={24} className="text-white/80" />} />
        <StatCard title="Batches Delivered" value="31" icon={<FiCheckCircle size={24} className="text-white/80" />} />
      </div>

      <div className="glass-panel p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Info</h2>
        <p className="text-white/80">
          Welcome to your dashboard. You can request a new batch or view your complete batch history using the navigation links in the sidebar.
        </p>
      </div>
    </div>
  );
}

export default ManufacturerDashboard;