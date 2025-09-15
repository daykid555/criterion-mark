import React from 'react';

const RecentSystemLogs = () => {
  // In a real application, this would fetch actual system logs/audit trails
  const logs = [
    { id: 1, timestamp: '2025-09-14 10:30:00', message: 'User \'admin\' logged in from 192.168.1.100.', type: 'info' },
    { id: 2, timestamp: '2025-09-14 10:25:15', message: 'Batch #B12345 approved by \'admin\'.', type: 'success' },
    { id: 3, timestamp: '2025-09-14 10:20:05', message: 'New user registration: \'john.doe\'.', type: 'info' },
    { id: 4, timestamp: '2025-09-14 10:15:30', message: 'API endpoint /reports accessed by \'pharmacy_user\'.', type: 'debug' },
    { id: 5, timestamp: '2025-09-14 10:10:00', message: 'Database backup initiated.', type: 'info' },
  ];

  const getLogColor = (type) => {
    switch (type) {
      case 'info':
        return 'text-blue-300';
      case 'success':
        return 'text-green-300';
      case 'warning':
        return 'text-yellow-300';
      case 'error':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="glass-panel p-6 mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Recent System Activity</h2>
      <div className="max-h-64 overflow-y-auto custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="mb-2 pb-2 border-b border-white/10 last:border-b-0">
            <p className="text-sm text-white/70">{log.timestamp}</p>
            <p className={`text-base ${getLogColor(log.type)}`}>{log.message}</p>
          </div>
        ))}
      </div>
      <p className="text-white/70 mt-4 text-sm">
        Displaying recent system events. (Placeholder data)
      </p>
    </div>
  );
};

export default RecentSystemLogs;
