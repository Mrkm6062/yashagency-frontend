import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 300,
    target: 'es2015'
  },
  server: {
    port: 3000,
    compress: true,
    hmr: process.env.NODE_ENV === 'production' ? false : true,
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  }
})