// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <-- Import the plugin

export default defineConfig({
  plugins: [
    react(),
    // --- THIS IS THE FIX ---
    // Add the PWA plugin configuration
    VitePWA({
      registerType: 'autoUpdate', // The app will update automatically when you deploy new code
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'The Criterion Mark',
        short_name: 'Criterion',
        description: 'A secure system for drug authentication and verification.',
        theme_color: '#1a2a45',
        icons: [
          {
            src: '/assets/logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})