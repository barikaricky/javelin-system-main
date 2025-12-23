import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  cacheDir: 'node_modules/.vite-cache',
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    proxy: process.env.CODESPACES !== 'true'
      ? {
          '/api': {
            target: 'http://127.0.0.1:3002',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
            ws: true,
          },
        }
      : undefined,
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    force: true,
  },
})
