import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ใช้ root URL ตอนพัฒนา แต่คง /dashboard/ สำหรับ production deployment
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/dashboard/',
  plugins: [react()],
  build: {
    outDir: '../dist/dashboard',
    emptyOutDir: true
  }
}))
