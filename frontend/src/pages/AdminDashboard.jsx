// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserPlus, FiCheckSquare, FiPackage, FiAlertTriangle } from 'react-icons/fi';
import apiClient from '../api';

// StatCard component remains the same, it was already well-designed
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

// Recent Activity component now takes activities as a prop
const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
       <div className="glass-panel p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Recent System Activity</h2>
        <p className="text-white/70 text-center py-4">No recent activity found.</p>
      </div>
    )
  }
  return (
    <div className="glass-panel p-6 rounded-lg mt-8">
      <h2 className="text-xl font-bold text-white mb-4">Recent System Activity</h2>
      <ul className="divide-y divide-white/10">
        {activities.map(activity => (
          <li key={activity.id} className="py-3 flex justify-between items-center">
            <p className="text-white/90">{activity.text}</p>
            <p className="text-xs text-white/50">{new Date(activity.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError('');
      try {
        // This single API call will fetch all the necessary dashboard data
        const response = await apiClient.get('/api/admin/dashboard-summary');
        setSummary(response.data);
      } catch (err) {
        setError('Failed to load dashboard data. The server may be unavailable.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading) {
    return <div className="text-center p-10 text-white/80">Loading Admin Dashboard...</div>;
  }
  
  if (error) {
    return (
      <div className="glass-panel p-8 m-auto mt-10 max-w-lg text-center bg-red-500/10 border-red-500/30">
        <FiAlertTriangle className="mx-auto text-red-400 h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 drop-shadow-lg">Admin Dashboard</h1>

      {/* Stats Grid with REAL data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pending Registrations" 
          value={summary?.stats?.pendingRegistrations ?? 0} 
          icon={<FiUserPlus size={24} className="text-white/80" />} 
          linkTo="/admin/registrations" 
        />
        <StatCard 
          title="Approval Queue" 
          value={summary?.stats?.approvalQueue ?? 0}
          icon={<FiCheckSquare size={24} className="text-white/80" />} 
          linkTo="/admin/approval-queue" 
        />
        <StatCard 
          title="Total Active Users" 
          value={summary?.stats?.totalActiveUsers ?? 0} 
          icon={<FiUsers size={24} className="text-white/80" />} 
          linkTo="/admin/users" 
        />
        <StatCard 
          title="Products Authenticated" 
          value={summary?.stats?.productsAuthenticated ?? 0}
          icon={<FiPackage size={24} className="text-white/80" />} 
          linkTo="/admin/history" 
        />
      </div>

      {/* Recent Activity Section with REAL data */}
      <RecentActivity activities={summary?.recentActivity} />
    </div>
  );
}

export default AdminDashboard;