import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html'
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/frontend"),
    },
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