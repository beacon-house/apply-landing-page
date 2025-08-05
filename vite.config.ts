import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    // Copy case studies to public folder during build
    copyPublicDir: true,
  },
  publicDir: 'public',
  server: {
    port: 3000,
    strictPort: true,
  }
});