import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/terminal': {
        target: 'ws://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})