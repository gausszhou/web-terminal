import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    proxy: {
      '/ws-terminal': {
        target: 'ws://192.168.4.199:63005',
        changeOrigin: true,
        ws: true
      },
      '/ws-vnc': {
        target: 'ws://192.168.4.199:63005',
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
