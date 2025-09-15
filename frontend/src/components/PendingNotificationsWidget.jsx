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
        ] = await Promise.all([
          apiClient.get('/api/admin/pending-users'),
          apiClient.get('/api/admin/pending-batches'),
        ]);

        setPendingCounts({
          registrations: registrationsRes.data.length,
          approvals: approvalsRes.data.length,
          reports: 0, // Placeholder
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
  const baseClasses = "glass-panel flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl";
  let colorClass = "";

  switch (color) {
    case "blue":
      colorClass = "text-blue-400";
      break;
    case "yellow":
      colorClass = "text-yellow-400";
      break;
    case "red":
      colorClass = "text-red-400";
      break;
    default:
      colorClass = "text-white";
  }

  return (
    <Link to={link} className={`${baseClasses}`}>
      <div className={`text-6xl font-bold ${colorClass}`}>{count}</div>
      <div className="text-xl mt-2 font-semibold text-white">{title}</div>
      {count > 0 && (
        <div className="mt-3 text-sm text-white/70 animate-pulse">View Pending</div>
      )}
    </Link>
  );
};

export default PendingNotificationsWidget;
