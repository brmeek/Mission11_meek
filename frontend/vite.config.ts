import { defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({}) => {
  const apiProxyTarget = 'https://bookstore-backend-hrceaafxeyd9akfy.westus2-01.azurewebsites.net'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
