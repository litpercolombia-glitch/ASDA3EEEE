// vitest.config.ts
// Configuración de Vitest para tests del frontend

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Configuración global
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    // Archivos de test
    include: ['tests/**/*.test.{ts,tsx}', 'tests/**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'backend'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'components/**/*.{ts,tsx}',
        'services/**/*.ts',
        'hooks/**/*.ts',
        'utils/**/*.ts',
        'stores/**/*.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/types/**',
        '**/*.d.ts',
        '**/index.ts',
        '**/__mocks__/**',
      ],
      thresholds: {
        global: {
          statements: 50,
          branches: 50,
          functions: 50,
          lines: 50,
        },
      },
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },

    // Pool
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
