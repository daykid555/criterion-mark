import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

const PendingNotificationsWidget = () => {
  const [pendingCounts, setPendingCounts] = useState({
    registrations: 0,
    approvals: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const [
          registrationsRes,
          approvalsRes,
          reportsRes,
        ] = await Promise.all([
          apiClient.get('/api/admin/registrations/pending/count'),
          apiClient.get('/api/admin/approvals/pending/count'),
          apiClient.get('/api/admin/reports/pending/count'),
        ]);

        setPendingCounts({
          registrations: registrationsRes.data.count,
          approvals: approvalsRes.data.count,
          reports: reportsRes.data.count,
        });
      } catch (err) {
        console.error('Error fetching pending counts:', err);
        setError('Failed to load pending counts.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCounts();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 text-center text-white/70">
        Loading pending notifications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  const hasPending =
    pendingCounts.registrations > 0 ||
    pendingCounts.approvals > 0 ||
    pendingCounts.reports > 0;

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Pending Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NotificationCard
          title="Registrations"
          count={pendingCounts.registrations}
          link="/admin/registration-queue"
          color="blue"
        />
        <NotificationCard
          title="Approvals"
          count={pendingCounts.approvals}
          link="/admin/approval-queue"
          color="yellow"
        />
        <NotificationCard
          title="Reports"
          count={pendingCounts.reports}
          link="/admin/report-management"
          color="red"
        />
      </div>
      {!hasPending && (
        <p className="text-white/70 mt-4 text-center">No pending actions at the moment. All clear!</p>
      )}
    </div>
  );
};

const NotificationCard = ({ title, count, link, color }) => {
  const baseClasses = "flex flex-col items-center justify-center p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105";
  let bgColorClass = "";
  let textColorClass = "text-white";

  switch (color) {
    case "blue":
      bgColorClass = "bg-blue-600/50 hover:bg-blue-500/70";
      break;
    case "yellow":
      bgColorClass = "bg-yellow-600/50 hover:bg-yellow-500/70";
      break;
    case "red":
      bgColorClass = "bg-red-600/50 hover:bg-red-500/70";
      break;
    default:
      bgColorClass = "bg-gray-600/50 hover:bg-gray-500/70";
  }

  return (
    <Link to={link} className={`${baseClasses} ${bgColorClass}`}>
      <div className="text-5xl font-bold">{count}</div>
      <div className="text-lg mt-2">{title}</div>
      {count > 0 && (
        <div className="mt-2 text-sm animate-pulse">View Pending</div>
      )}
    </Link>
  );
};

export default PendingNotificationsWidget;
