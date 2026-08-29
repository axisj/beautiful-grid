import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'beautiful-grid/editors', replacement: path.resolve(__dirname, 'beautiful-grid/editors/index.ts') },
      { find: 'beautiful-grid', replacement: path.resolve(__dirname, 'beautiful-grid/index.tsx') },
    ],
  },
  test: {
    testTimeout: 15000,
  },
});
