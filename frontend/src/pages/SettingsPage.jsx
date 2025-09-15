import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import apiClient from '../api'; // Import apiClient

const SettingsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth(); // Get token from AuthContext
  const [settings, setSettings] = useState({
    hapticFeedbackEnabled: false,
    cameraAutoStartEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data,
        }));
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSettings();
    } else {
      setLoading(false); // Not authenticated, use default settings
    }
  }, [token]);

  // Function to update settings on the backend
  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings); // Optimistic update
    try {
      await apiClient.post('/api/user/settings', { settings: newSettings }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(`Failed to update ${key} setting:`, err);
      setError(`Failed to save ${key} setting.`);
      // Revert optimistic update if API call fails
      setSettings(prevSettings => ({ ...prevSettings, [key]: !value }));
    }
  };

  const handleHapticFeedbackToggle = () => {
    updateSetting('hapticFeedbackEnabled', !settings.hapticFeedbackEnabled);
  };

  const handleCameraAutoStartToggle = () => {
    updateSetting('cameraAutoStartEnabled', !settings.cameraAutoStartEnabled);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-gray-700">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800 mr-4">
            <FaArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-lg text-gray-700">Haptic Feedback</span>
          <label htmlFor="haptic-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                id="haptic-toggle"
                className="sr-only"
                checked={settings.hapticFeedbackEnabled}
                onChange={handleHapticFeedbackToggle}
              />
              <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                  settings.hapticFeedbackEnabled ? 'translate-x-full bg-blue-600' : ''
                }`}
              ></div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <span className="text-lg text-gray-700">Camera Auto-Start</span>
          <label htmlFor="camera-auto-start-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                id="camera-auto-start-toggle"
                className="sr-only"
                checked={settings.cameraAutoStartEnabled}
                onChange={handleCameraAutoStartToggle}
              />
              <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                  settings.cameraAutoStartEnabled ? 'translate-x-full bg-blue-600' : ''
                }`}
              ></div>
            </div>
          </label>
        </div>

        {/* Add more settings options here */}
      </div>
    </div>
  );
};

export default SettingsPage;