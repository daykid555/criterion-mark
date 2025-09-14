// frontend/src/components/NodeBackground.jsx
// actually complete code

import React, { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

const NodeBackground = ({ theme = 'default' }) => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const themeColors = {
    default: { particle: '#8B5CF6', link: '#ffffff' },
    success: { particle: '#22c55e', link: '#a7f3d0' },
    warning: { particle: '#facc15', link: '#fde68a' }, // Brighter link for yellow
    error:   { particle: '#ef4444', link: '#fecaca' },
  };

  const selectedTheme = themeColors[theme] || themeColors.default;

  const particlesOptions = useMemo(() => ({
    background: {
      color: {
        // THIS IS THE FIX: Only be transparent when a theme is active.
        // Otherwise, use the original dark background color.
        value: theme === 'default' ? '#0d1117' : 'transparent',
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: 'grab' } },
      modes: { grab: { distance: 150, links: { opacity: 0.5 } } },
    },
    particles: {
      color: {
        value: selectedTheme.particle,
      },
      links: {
        color: selectedTheme.link,
        distance: 150,
        enable: true,
        opacity: 0.1,
        width: 1,
      },
      move: { direction: 'none', enable: true, outModes: 'bounce', random: false, speed: 0.5, straight: false },
      number: { density: { enable: true }, value: 60 },
      opacity: { value: 0.5 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }), [selectedTheme]);

  return (
    <div className="absolute top-0 left-0 w-full h-full z-0">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
    </div>
  );
};

export default NodeBackground;