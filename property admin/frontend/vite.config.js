import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui':   ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-charts': ['recharts'],
          'vendor-i18n':  ['i18next', 'react-i18next'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
});
