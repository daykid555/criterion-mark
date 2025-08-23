// frontend/src/pages/PrintingDashboard.jsx
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';
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

function PrintingDashboard() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Printing Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Batches in Print Queue" value="7" icon={<FiPrinter size={24} className="text-white/80" />} linkTo="/printing/queue" />
        <StatCard title="Jobs Completed Today" value="14" icon={<FiCheckCircle size={24} className="text-white/80" />} linkTo="/printing/history" />
      </div>
      
      <div className="glass-panel p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Get Started</h2>
        <p className="text-white/80 mb-4">
          View all active jobs assigned to you in the print queue.
        </p>
        <Link to="/printing/queue" className="glass-button font-bold py-2 px-5 rounded-lg">
          View Active Queue
        </Link>
      </div>
    </div>
  );
}

export default PrintingDashboard;