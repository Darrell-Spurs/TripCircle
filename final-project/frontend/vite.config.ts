import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Note: API calls use full URLs via VITE_API_BASE_URL environment variable
    // No proxy configuration needed
  },
})

