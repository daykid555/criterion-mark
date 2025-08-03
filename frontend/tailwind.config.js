// frontend/tailwind.config.js
// actually complete code

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Your existing backgroundImage theme
      backgroundImage: {
        'gradient-animated': 'linear-gradient(-45deg, #6b21a8, #4f46e5, #1d4ed8, #0284c7, #0d9488, #059669)',
      },
      // We will merge my new keyframes with your existing ones
      keyframes: {
        // Your existing gradient keyframe
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        // --- NEW KEYFRAMES TO ADD ---
        'blink-green': {
          '50%': { boxShadow: '0 0 25px 5px rgba(34, 197, 94, 0.6)' },
        },
        'blink-yellow': {
          '50%': { boxShadow: '0 0 25px 5px rgba(234, 179, 8, 0.6)' },
        },
        'blink-red': {
          '50%': { boxShadow: '0 0 25px 5px rgba(239, 68, 68, 0.6)' },
        },
      },
      // We will merge my new animations with your existing ones
      animation: {
        // Your existing gradient animation
        gradient: 'gradient 20s ease infinite',
        // --- NEW ANIMATIONS TO ADD ---
        'blink-green': 'blink-green 2s infinite',
        'blink-yellow': 'blink-yellow 2s infinite',
        'blink-red': 'blink-red 2s infinite',
      }
    },
  },
  plugins: [],
}