import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';

function SettingsPage() {
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [cameraAutoStart, setCameraAutoStart] = useState(true);

  useEffect(() => {
    // Load settings from localStorage on component mount
    const storedVibration = localStorage.getItem('vibrationEnabled');
    if (storedVibration !== null) {
      setVibrationEnabled(JSON.parse(storedVibration));
    }

    const storedCameraAutoStart = localStorage.getItem('cameraAutoStart');
    if (storedCameraAutoStart !== null) {
      setCameraAutoStart(JSON.parse(storedCameraAutoStart));
    }
  }, []);

  const handleVibrationToggle = () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    localStorage.setItem('vibrationEnabled', JSON.stringify(newValue));
  };

  const handleCameraAutoStartToggle = () => {
    const newValue = !cameraAutoStart;
    setCameraAutoStart(newValue);
    localStorage.setItem('cameraAutoStart', JSON.stringify(newValue));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex items-center mb-8">
          <BackButton />
          <h1 className="text-3xl sm:text-4xl font-bold text-white ml-4 drop-shadow-lg">Settings</h1>
        </div>

        <div className="glass-panel p-6 sm:p-8 space-y-6">
          {/* Vibration Setting */}
          <div className="flex items-center justify-between">
            <label htmlFor="vibrationToggle" className="text-white text-lg cursor-pointer">
              Enable Vibration on Fake Scan
            </label>
            <input
              type="checkbox"
              id="vibrationToggle"
              checked={vibrationEnabled}
              onChange={handleVibrationToggle}
              className="toggle toggle-lg toggle-primary" // Assuming DaisyUI or similar toggle styling
            />
          </div>

          {/* Camera Auto-Start Setting */}
          <div className="flex items-center justify-between">
            <label htmlFor="cameraAutoStartToggle" className="text-white text-lg cursor-pointer">
              Auto-start Camera on Page Load
            </label>
            <input
              type="checkbox"
              id="cameraAutoStartToggle"
              checked={cameraAutoStart}
              onChange={handleCameraAutoStartToggle}
              className="toggle toggle-lg toggle-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
