import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es'
  },
  server: {
    proxy: {
      '/api/celestrak': {
        target: 'https://celestrak.org',
        changeOrigin: true,
        rewrite: () => '/NORAD/elements/gp.php?GROUP=active&FORMAT=JSON'
      }
    }
  }
})
