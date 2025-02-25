import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/web3/', // 与仓库名一致，用于 GitHub Pages
}) 