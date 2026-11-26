import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev proxy: the browser calls same-origin /api and /uploads, Vite forwards them to Express,
// so CORS is not involved locally. In production VITE_API_URL points at the deployed API.
// API_PROXY_TARGET lets you point at another port (macOS uses 5000 for AirPlay).
const target = process.env.API_PROXY_TARGET || 'http://localhost:5001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/uploads': target,
    },
  },
});
