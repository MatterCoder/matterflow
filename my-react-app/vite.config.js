import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({

  //change port for production
  preview: {
    port: 7001,
  },
  // for dev
  server: {
    port: 7000,
  },  
  plugins: [react()],
})
