import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Legacy support - to be removed after migration
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // ============================================
    // BUILD OPTIMIZATION - Phase 2.2
    // ============================================
    build: {
      // Target modern browsers for smaller bundle
      target: 'es2020',
      // Chunk size warning limit (500KB)
      chunkSizeWarningLimit: 500,
      // Minification (using esbuild - built-in)
      minify: isProd ? 'esbuild' : false,
      // Rollup options for manual chunk splitting
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // React core
            'vendor-react': ['react', 'react-dom'],
            // State management
            'vendor-state': ['zustand'],
            // UI utilities
            'vendor-ui': ['lucide-react'],
            // Excel processing (heavy)
            'vendor-excel': ['xlsx'],
            // Chart libraries (if used)
            'vendor-charts': ['recharts'],
            // HTML/PDF processing
            'vendor-html': ['html2canvas', 'dompurify'],
          },
          // Asset file naming for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|ttf|eot/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // Source maps only for production debugging
      sourcemap: isProd ? 'hidden' : true,
      // CSS code splitting
      cssCodeSplit: true,
      // Report compressed size
      reportCompressedSize: true,
    },
    // ============================================
    // OPTIMIZATION - Tree shaking and deps
    // ============================================
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'lucide-react',
      ],
      exclude: [
        // Exclude heavy optional deps from pre-bundling
      ],
    },
    // ============================================
    // CSS OPTIMIZATION
    // ============================================
    css: {
      devSourcemap: true,
    },
    // ============================================
    // PREVIEW (for testing production builds)
    // ============================================
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
