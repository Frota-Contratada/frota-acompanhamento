import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  server: {
    allowedHosts: true,
    port: 3001
  },
  preview: {
    port: 3001
  }
})
