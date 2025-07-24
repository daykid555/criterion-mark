/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // We extend the backgroundImage theme to add our custom gradient
      backgroundImage: {
        'gradient-animated': 'linear-gradient(-45deg, #6b21a8, #4f46e5, #1d4ed8, #0284c7, #0d9488, #059669)',
      },
      // We extend keyframes and animation for the movement
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      animation: {
        gradient: 'gradient 20s ease infinite',
      }
    },
  },
  plugins: [],
}