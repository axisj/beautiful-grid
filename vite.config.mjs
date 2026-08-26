import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
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
});
