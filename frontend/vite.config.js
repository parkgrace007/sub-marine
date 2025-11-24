import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 KB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks only - let Vite handle feature chunks automatically
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase'
            }
            if (id.includes('lightweight-charts')) {
              return 'vendor-charts'
            }
            if (id.includes('axios')) {
              return 'vendor-utils'
            }
          }
          // Removed manual feature chunk splitting to fix initialization order issues
        }
      }
    }
  }
})
