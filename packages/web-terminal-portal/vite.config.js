import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    proxy: {
      '/api/ws/terminal': {
        target: 'ws://localhost:3000',
        changeOrigin: true,
        ws: true
      },
      '/api/ws/vnc': {
        target: 'ws://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
