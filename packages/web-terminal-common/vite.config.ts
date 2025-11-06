import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'WebTerminalCommon',
            fileName: 'index'
        },
        rollupOptions: {
            output: {
                exports: 'named'
            }
        }
    },
    test: {
        globals: true,
        environment: 'node'
    }
})