import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Wllama can use SharedArrayBuffer-backed worker threads only in a
  // cross-origin-isolated page. Production already sets these in public/_headers;
  // mirror them locally so dev/preview testing does not silently fall to one thread.
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
})
