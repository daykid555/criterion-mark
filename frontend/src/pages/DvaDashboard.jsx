// frontend/src/pages/DvaDashboard.jsx
import { FiCheckSquare, FiCheckCircle, FiXCircle } from 'react-icons/fi';
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

function DvaDashboard() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">DVA Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Items in Your Queue" value="12" icon={<FiCheckSquare size={24} className="text-white/80" />} linkTo="/dva/approval-queue" />
        <StatCard title="Approvals Today" value="35" icon={<FiCheckCircle size={24} className="text-white/80" />} linkTo="/dva/history" />
        <StatCard title="Rejections Today" value="2" icon={<FiXCircle size={24} className="text-white/80" />} linkTo="/dva/history" />
      </div>

      <div className="glass-panel p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Primary Actions</h2>
        <p className="text-white/80 mb-4">
          Your primary task is to process items in the approval queue. You can access the queue directly from the card above or from the sidebar.
        </p>
        <Link to="/dva/approval-queue" className="glass-button font-bold py-2 px-5 rounded-lg">
          Go to Approval Queue
        </Link>
      </div>
    </div>
  );
}

export default DvaDashboard;