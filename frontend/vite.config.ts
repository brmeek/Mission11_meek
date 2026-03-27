import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://localhost:5204',
=======
        target: 'http://localhost:5000',
>>>>>>> main
        changeOrigin: true,
      },
    },
  },
})
