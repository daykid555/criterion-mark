// frontend/src/pages/SkincareDashboard.jsx
import { FiFileText, FiPlusCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon }) => (
  <div className="glass-panel p-6 rounded-lg">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/70">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="bg-white/10 p-3 rounded-md">{icon}</div>
    </div>
  </div>
);

function SkincareDashboard() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">Skincare Brand Dashboard</h1>
        <Link to="/skincare/add-product" className="glass-button font-bold py-2 px-5 rounded-lg mt-4 sm:mt-0">
          Add New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Total Products Registered" value="18" icon={<FiFileText size={24} className="text-white/80" />} />
        <StatCard title="Products Added This Month" value="4" icon={<FiPlusCircle size={24} className="text-white/80" />} />
      </div>

       <div className="glass-panel p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Welcome</h2>
        <p className="text-white/80">
          Manage your product portfolio by adding new products or viewing your complete product history via the sidebar navigation.
        </p>
      </div>
    </div>
  );
}

export default SkincareDashboard;