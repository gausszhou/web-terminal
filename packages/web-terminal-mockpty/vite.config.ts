import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: './src/index.ts',
      name: 'MockPty',
      fileName: 'index'
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
});
