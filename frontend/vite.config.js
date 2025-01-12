import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_FRONTEND_HOST,
    port: process.env.VITE_FRONTEND_PORT
  },
  resolve: {
    alias: [
      {
        find: /^leaflet$/,
        replacement: 'leaflet/dist/leaflet'  // Use minified leaflet source.
      },
      {
        find: '@components',
        replacement: fileURLToPath(new URL('./src/components', import.meta.url))
      },
      {
        find: '@layout',
        replacement: fileURLToPath(new URL('./src/layout', import.meta.url))
      },
      {
        find: '@hooks',
        replacement: fileURLToPath(new URL('./src/hooks', import.meta.url))
      },
      {
        find: '@services',
        replacement: fileURLToPath(new URL('./src/services', import.meta.url))
      },
      {
        find: '@utils',
        replacement: fileURLToPath(new URL('./src/utils', import.meta.url))
      },
      {
        find: '@testing',
        replacement: fileURLToPath(new URL('./src/testing', import.meta.url))
      }
    ]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/testing/setup.js',
  }
})