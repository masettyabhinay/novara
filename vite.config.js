import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { roadmapApiPlugin } from './server/apiMiddleware.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), roadmapApiPlugin()],
  server: {
    port: 3000,
    open: true
  }
});
