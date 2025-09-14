import React from 'react';

const SystemHealthOverview = () => {
  // In a real application, this would fetch actual system health data
  const healthStatus = {
    database: { status: 'Operational', color: 'green' },
    api: { status: 'Operational', color: 'green' },
    authService: { status: 'Operational', color: 'green' },
    // Add more services as needed
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational':
        return 'text-green-400';
      case 'Degraded':
        return 'text-yellow-400';
      case 'Down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="glass-panel p-6 mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">System Health Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {Object.entries(healthStatus).map(([service, data]) => (
          <div key={service} className="flex items-center">
            <span className={`h-3 w-3 rounded-full mr-2 ${data.color === 'green' ? 'bg-green-500' : data.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
            <span className="text-white capitalize">{service}: </span>
            <span className={`ml-2 ${getStatusColor(data.status)}`}>{data.status}</span>
          </div>
        ))}
      </div>
      <p className="text-white/70 mt-4 text-sm">
        All core services are currently operational. (Placeholder data)
      </p>
    </div>
  );
};

export default SystemHealthOverview;
