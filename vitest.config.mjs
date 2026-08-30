import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'beautiful-grid/editors',
        replacement: fileURLToPath(new URL('./beautiful-grid/editors/index.ts', import.meta.url)),
      },
      {
        find: 'beautiful-grid',
        replacement: fileURLToPath(new URL('./beautiful-grid/index.tsx', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setupTests.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
  },
});
