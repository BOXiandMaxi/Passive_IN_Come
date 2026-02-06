import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/backend': {
        // ต้องชี้ไปที่โฟลเดอร์ backend ของคุณใน XAMPP
        target: 'http://localhost/passive_income/backend', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ''), // ตัดคำว่า /backend ออกเพื่อให้เหลือแค่ชื่อไฟล์ .php
      },
    },
  },
})