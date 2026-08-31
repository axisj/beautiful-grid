// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sitemap from '@astrojs/sitemap';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://bgrid.axisj.com',
  output: 'static',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-high-contrast',
      },
    },
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: page => !page.includes('/demo/') && !page.includes('/docs/') && !page.includes('/examples/'),
    }),
  ],
  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
    },
    optimizeDeps: {
      // Demo modules live outside the site package, so Vite cannot discover
      // their runtime dependencies reliably during the initial dependency scan.
      include: ['@ant-design/icons', 'antd', 'dayjs', 'lucide-react', 'uuid'],
    },
    resolve: {
      // Demo and library modules are imported from the repository root, which
      // also has React installed. Keep every island and AntD portal on the
      // site's React instance to prevent invalid hook calls when a modal opens.
      dedupe: ['react', 'react-dom'],
      alias: [
        { find: 'beautiful-grid/style.css', replacement: path.resolve(__dirname, '../beautiful-grid/style.css') },
        {
          find: 'beautiful-grid/editors',
          replacement: path.resolve(__dirname, '../beautiful-grid/editors/index.ts'),
        },
        { find: 'beautiful-grid', replacement: path.resolve(__dirname, '../beautiful-grid/index.tsx') },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
});
