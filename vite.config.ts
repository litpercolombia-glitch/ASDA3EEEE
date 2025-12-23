import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*.png', 'screenshots/*.png'],
        manifest: {
          name: 'LITPER PRO - Enterprise Logistics',
          short_name: 'LITPER PRO',
          description: 'Plataforma Enterprise de Gestión Logística Inteligente con IA',
          theme_color: '#f59e0b',
          background_color: '#0f172a',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait-primary',
          icons: [
            { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
            { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
          shortcuts: [
            {
              name: 'Seguimiento',
              url: '/?tab=seguimiento',
              icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
            },
            {
              name: 'Dashboard',
              url: '/?tab=dashboard',
              icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.litper\.com\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
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
