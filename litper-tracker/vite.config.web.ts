import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Web-only config (no Electron)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
