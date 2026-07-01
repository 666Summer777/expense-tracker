import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/expense-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Expense Tracker',
        short_name: 'Expense',
        description: 'Track your daily expenses',
        theme_color: '#1a1a2e',
        background_color: '#f2f2f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/expense-tracker/',
        scope: '/expense-tracker/',
        icons: [
          { src: '/expense-tracker/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/expense-tracker/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
  },
})
