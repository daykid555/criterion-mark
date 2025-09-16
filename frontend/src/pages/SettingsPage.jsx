import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa'; // Keep for now, might replace with BackButton
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';
import BackButton from '../components/BackButton'; // Import BackButton

const SettingsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    hapticFeedbackEnabled: false,
    cameraAutoStartEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setLoading(false);
    }
  }, [token]);

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
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl text-center text-white">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center mb-8">
          <BackButton />
          <h1 className="text-3xl sm:text-4xl font-bold text-white ml-4 drop-shadow-lg">Settings</h1>
        </div>

        <div className="glass-panel p-6 space-y-4"> {/* Use glass-panel for styling */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-lg text-white">Haptic Feedback</span>
            <label htmlFor="haptic-toggle" className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  id="haptic-toggle"
                  className="sr-only"
                  checked={settings.hapticFeedbackEnabled}
                  onChange={handleHapticFeedbackToggle}
                />
                <div className="block bg-gray-600/50 w-14 h-8 rounded-full"></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                    settings.hapticFeedbackEnabled ? 'translate-x-6 bg-cyan-400' : ''
                  }`}
                ></div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <span className="text-lg text-white">Camera Auto-Start</span>
            <label htmlFor="camera-auto-start-toggle" className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  id="camera-auto-start-toggle"
                  className="sr-only"
                  checked={settings.cameraAutoStartEnabled}
                  onChange={handleCameraAutoStartToggle}
                />
                <div className="block bg-gray-600/50 w-14 h-8 rounded-full"></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                    settings.cameraAutoStartEnabled ? 'translate-x-6 bg-cyan-400' : ''
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;