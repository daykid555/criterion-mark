import React, { useState, useEffect } from 'react';
import apiClient from '../api'; // Assuming apiClient is configured for API calls

const ProductScanAnalysisWidget = () => {
  const [scanData, setScanData] = useState({
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    scansByRegion: [], // e.g., [{ region: 'North', count: 120 }, { region: 'South', count: 80 }]
    scansByTime: [],   // e.g., [{ date: '2025-09-01', count: 50 }, { date: '2025-09-02', count: 70 }]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScanData = async () => {
      try {
        // TODO: Replace with actual API endpoint for fetching scan analytics
        // const response = await apiClient.get('/api/manufacturer/scan-analytics');
        // setScanData(response.data);

        // Mock data for demonstration
        const mockData = {
          totalScans: 1250,
          successfulScans: 1180,
          failedScans: 70,
          scansByRegion: [
            { region: 'North America', count: 500 },
            { region: 'Europe', count: 300 },
            { region: 'Asia', count: 400 },
            { region: 'South America', count: 50 },
          ],
          scansByTime: [
            { date: '2025-09-08', count: 150 },
            { date: '2025-09-09', count: 180 },
            { date: '2025-09-10', count: 200 },
            { date: '2025-09-11', count: 220 },
            { date: '2025-09-12', count: 250 },
            { date: '2025-09-13', count: 100 },
            { date: '2025-09-14', count: 150 },
          ],
        };
        setScanData(mockData);
      } catch (err) {
        console.error('Error fetching scan analytics:', err);
        setError('Failed to load scan analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchScanData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 text-center text-white/70">
        Loading scan analytics...
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

  const total = scanData.totalScans;
  const successfulPercentage = total > 0 ? ((scanData.successfulScans / total) * 100).toFixed(1) : 0;
  const failedPercentage = total > 0 ? ((scanData.failedScans / total) * 100).toFixed(1) : 0;

  // Calculate max count for bar chart scaling
  const maxRegionCount = Math.max(...scanData.scansByRegion.map(s => s.count), 0);
  const maxTimeCount = Math.max(...scanData.scansByTime.map(s => s.count), 0);

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold text-white mb-4">Product Scan Analytics</h2>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-white/70 text-sm">Total Scans</p>
          <p className="text-3xl font-bold text-indigo-400">{scanData.totalScans}</p>
        </div>
        <div className="text-center">
          <p className="text-white/70 text-sm">Successful</p>
          <p className="text-3xl font-bold text-green-400">{scanData.successfulScans} ({successfulPercentage}%)</p>
        </div>
        <div className="text-center">
          <p className="text-white/70 text-sm">Failed</p>
          <p className="text-3xl font-bold text-red-400">{scanData.failedScans} ({failedPercentage}%)</p>
        </div>
      </div>

      {/* Scans by Region (Bar Chart) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Scans by Region</h3>
        <div className="space-y-2">
          {scanData.scansByRegion.map((data, index) => (
            <div key={index} className="flex items-center">
              <p className="text-white/70 w-28 text-sm">{data.region}</p>
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(data.count / maxRegionCount) * 100}%` }}
                ></div>
              </div>
              <p className="text-white ml-3 text-sm">{data.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scans by Time (Bar Chart) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Scans Over Time</h3>
        <div className="space-y-2">
          {scanData.scansByTime.map((data, index) => (
            <div key={index} className="flex items-center">
              <p className="text-white/70 w-28 text-sm">{data.date}</p>
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div
                  className="bg-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(data.count / maxTimeCount) * 100}%` }}
                ></div>
              </div>
              <p className="text-white ml-3 text-sm">{data.count}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-white/70 mt-4 text-sm">
        Note: For more advanced visualizations (e.g., interactive charts, pie charts), consider installing a dedicated charting library like Recharts or Chart.js.
      </p>
    </div>
  );
};

export default ProductScanAnalysisWidget;
