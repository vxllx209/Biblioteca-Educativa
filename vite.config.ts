import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // One bundle (≈170 KB gzip) keeps the offline app shell simple: everything is cached on first load.
  build: { chunkSizeWarningLimit: 800 },
})
