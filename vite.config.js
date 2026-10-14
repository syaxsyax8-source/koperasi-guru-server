import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Dengarkan di semua interface — wajib untuk DevTunnels / akses dari HP
    host: '0.0.0.0',
    port: 5173,
    // Izinkan semua host (DevTunnels menggunakan domain *.devtunnels.ms)
    allowedHosts: 'all',
    proxy: {
      // Proxy HTTP API ke server Express
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Socket.io WebSocket ke server Express
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,           // aktifkan WebSocket proxy
        rewriteWsOrigin: true,
      },
    },
  },
})
