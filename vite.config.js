import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    allowedHosts: true,
    port: 3001
  },
  preview: {
    port: 3001
  }
})
