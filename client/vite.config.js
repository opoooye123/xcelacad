import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // host: true so the dev server is reachable from a phone
    // on the same network for responsive testing. Remember to
    // add that origin to CORS_ORIGINS on the server.
    host: true,
  },
})
