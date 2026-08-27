import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages(プロジェクトページ)配信のためbase pathをリポジトリ名に合わせる
export default defineConfig({
  base: '/shooting-game/',
  plugins: [react()],
})
