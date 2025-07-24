import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim'; // Correct import path

const NodeBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    // This is the correct way to initialize the engine
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    // ... (options are the same)
    background: { color: { value: '#0d1117' } },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: 'grab' } },
      modes: { grab: { distance: 150, links: { opacity: 0.5 } } },
    },
    particles: {
      color: { value: '#8B5CF6' },
      links: { color: '#ffffff', distance: 150, enable: true, opacity: 0.1, width: 1 },
      move: { direction: 'none', enable: true, outModes: 'bounce', random: false, speed: 0.5, straight: false },
      number: { density: { enable: true }, value: 60 },
      opacity: { value: 0.5 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full z-0">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
    </div>
  );
};
export default NodeBackground; 