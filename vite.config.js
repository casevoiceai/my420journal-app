import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { phase1ExternalTestBoundariesPlugin } from './src/lib/phase1BuildBoundaries.js'

export default defineConfig({
  plugins: [
    phase1ExternalTestBoundariesPlugin(),
    react(),
    tailwindcss(),
  ],
})
