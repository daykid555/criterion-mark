// frontend/vite.config.js - CORRECTED

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    plugins: [
      react(),
      // Conditionally apply the VitePWA plugin
      // It will be enabled for 'build' but disabled for 'dev' (serve)
      !isDev && VitePWA({
        registerType: 'autoUpdate',
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
  }
})