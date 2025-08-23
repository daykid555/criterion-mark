// frontend/src/pages/LogisticsDashboard.jsx
import { FiTruck, FiPackage } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, linkTo }) => (
  <Link to={linkTo} className="glass-panel p-6 rounded-lg flex items-start justify-between hover:bg-white/10 transition-colors">
    <div>
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    <div className="bg-white/10 p-3 rounded-md">{icon}</div>
  </Link>
);

function LogisticsDashboard() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Logistics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Batches for Pickup" value="5" icon={<FiPackage size={24} className="text-white/80" />} linkTo="/logistics/active" />
        <StatCard title="Batches In Transit" value="11" icon={<FiTruck size={24} className="text-white/80" />} linkTo="/logistics/active" />
      </div>

      <div className="glass-panel p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Your Active Shipments</h2>
        <p className="text-white/80 mb-4">
          View all batches that are ready for pickup or are currently in transit.
        </p>
        <Link to="/logistics/active" className="glass-button font-bold py-2 px-5 rounded-lg">
          View Active Shipments
        </Link>
      </div>
    </div>
  );
}

export default LogisticsDashboard;