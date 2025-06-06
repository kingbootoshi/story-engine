import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  root: '.',
  build: {
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    proxy: {
      // Front-end calls  →  http://localhost:5173/api/trpc/…
      // Proxy forwards  →  http://localhost:3001/api/trpc/…
      '/api/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: false,          // keep the full path
        rewrite: path => path        // (explicit – not strictly required)
      },

      // Any REST endpoints we already expose work unchanged
      '/api/worlds': {
        target: 'http://localhost:3001',
        changeOrigin: false
      }
    }
  }
})