import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
      '@handlers': resolve(__dirname, './src/handlers'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
});
