import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 41006,
    proxy: {
      '/api': {
        target: 'http://localhost:41106',
        changeOrigin: true
      }
    }
  }
})
