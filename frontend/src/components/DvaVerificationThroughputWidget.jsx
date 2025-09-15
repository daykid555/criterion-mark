import React, { useState, useEffect } from 'react';
import apiClient from '../api'; // Assuming apiClient is configured for API calls

const DvaVerificationThroughputWidget = () => {
  const [throughputData, setThroughputData] = useState({
    today: 0,
    week: 0,
    dailyThroughput: [], // e.g., [{ date: '2025-09-08', count: 15 }, { date: '2025-09-09', count: 20 }]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchThroughputData = async () => {
      try {
        // TODO: Replace with actual API endpoint for fetching DVA verification throughput
        // const response = await apiClient.get('/api/dva/verification-throughput');
        // setThroughputData(response.data);

        // Mock data for demonstration
        const mockData = {
          today: 25,
          week: 120,
          dailyThroughput: [
            { date: '2025-09-08', count: 15 },
            { date: '2025-09-09', count: 20 },
            { date: '2025-09-10', count: 25 },
            { date: '2025-09-11', count: 18 },
            { date: '2025-09-12', count: 30 },
            { date: '2025-09-13', count: 22 },
            { date: '2025-09-14', count: 25 },
          ],
        };
        setThroughputData(mockData);
      } catch (err) {
        console.error('Error fetching DVA verification throughput:', err);
        setError('Failed to load verification throughput.');
      } finally {
        setLoading(false);
      }
    };

    fetchThroughputData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 text-center text-white/70">
        Loading verification throughput...
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

  // Calculate max count for bar chart scaling
  const maxDailyCount = Math.max(...throughputData.dailyThroughput.map(d => d.count), 0);

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold text-white mb-4">Verification Throughput</h2>

      {/* Overview Numbers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-white/70 text-sm">Today</p>
          <p className="text-3xl font-bold text-green-400">{throughputData.today}</p>
        </div>
        <div className="text-center">
          <p className="text-white/70 text-sm">This Week</p>
          <p className="text-3xl font-bold text-green-400">{throughputData.week}</p>
        </div>
      </div>

      {/* Daily Throughput (Bar Chart) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Daily Throughput (Last 7 Days)</h3>
        <div className="space-y-2">
          {throughputData.dailyThroughput.map((data, index) => (
            <div key={index} className="flex items-center">
              <p className="text-white/70 w-28 text-sm">{data.date}</p>
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(data.count / maxDailyCount) * 100}%` }}
                ></div>
              </div>
              <p className="text-white ml-3 text-sm">{data.count}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-white/70 mt-4 text-sm">
        Note: For more advanced visualizations (e.g., interactive line charts), consider installing a dedicated charting library like Recharts or Chart.js.
      </p>
    </div>
  );
};

export default DvaVerificationThroughputWidget;
