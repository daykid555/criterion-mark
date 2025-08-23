// frontend/src/pages/AdminDashboard.jsx
import { FiUsers, FiUserPlus, FiCheckSquare, FiPackage } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Placeholder Stat Card Component
const StatCard = ({ title, value, icon, linkTo }) => (
  <Link to={linkTo} className="glass-panel p-6 rounded-lg flex items-start justify-between hover:bg-white/10 transition-colors">
    <div>
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    <div className="bg-white/10 p-3 rounded-md">
      {icon}
    </div>
  </Link>
);

// Placeholder Recent Activity Component
const RecentActivity = () => {
  const activities = [
    { id: 1, text: "New registration pending for 'PharmaCo'", time: "2m ago" },
    { id: 2, text: "Batch #B48-X12 approved", time: "15m ago" },
    { id: 3, text: "Admin 'David' deactivated user 'TestUser'", time: "1h ago" },
    { id: 4, text: "New Batch request from 'HealthWell Inc.'", time: "3h ago" },
  ];
  return (
    <div className="glass-panel p-6 rounded-lg mt-8">
      <h2 className="text-xl font-bold text-white mb-4">Recent System Activity</h2>
      <ul className="divide-y divide-white/10">
        {activities.map(activity => (
          <li key={activity.id} className="py-3 flex justify-between items-center">
            <p className="text-white/90">{activity.text}</p>
            <p className="text-xs text-white/50">{activity.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};


function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pending Registrations" value="3" icon={<FiUserPlus size={24} className="text-white/80" />} linkTo="/admin/registrations" />
        <StatCard title="Approval Queue" value="8" icon={<FiCheckSquare size={24} className="text-white/80" />} linkTo="/admin/approval-queue" />
        <StatCard title="Total Active Users" value="124" icon={<FiUsers size={24} className="text-white/80" />} linkTo="/admin/users" />
        <StatCard title="Products Authenticated" value="2,591" icon={<FiPackage size={24} className="text-white/80" />} linkTo="/admin/history" />
      </div>

      {/* Recent Activity Section */}
      <RecentActivity />
    </div>
  );
}

export default AdminDashboard;