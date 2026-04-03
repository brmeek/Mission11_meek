import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://bookstore-backend-hrceaafxeyd9akfy.westus2-01.azurewebsites.net',
        changeOrigin: true,
      },
    },
  },
})
