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
  redirects: {
    '/learn/editor-plugins': { status: 301, destination: '/plugins' },
    '/learn/editor-plugins-custom': { status: 301, destination: '/plugins/custom' },
    '/learn/editor-plugins-antd': { status: 301, destination: '/plugins/antd' },
    '/learn/editor-plugins-shadcn': { status: 301, destination: '/plugins/shadcn' },
    '/learn/editor-plugins-mui': { status: 301, destination: '/plugins/mui' },
    '/learn/editor-plugins-mantine': { status: 301, destination: '/plugins/mantine' },
    '/learn/editor-plugins.md': { status: 301, destination: '/plugins.md' },
    '/learn/editor-plugins-custom.md': { status: 301, destination: '/plugins/custom.md' },
    '/learn/editor-plugins-antd.md': { status: 301, destination: '/plugins/antd.md' },
    '/learn/editor-plugins-shadcn.md': { status: 301, destination: '/plugins/shadcn.md' },
    '/learn/editor-plugins-mui.md': { status: 301, destination: '/plugins/mui.md' },
    '/learn/editor-plugins-mantine.md': { status: 301, destination: '/plugins/mantine.md' },
    '/en/learn/editor-plugins': { status: 301, destination: '/en/plugins' },
    '/en/learn/editor-plugins-custom': { status: 301, destination: '/en/plugins/custom' },
    '/en/learn/editor-plugins-antd': { status: 301, destination: '/en/plugins/antd' },
    '/en/learn/editor-plugins-shadcn': { status: 301, destination: '/en/plugins/shadcn' },
    '/en/learn/editor-plugins-mui': { status: 301, destination: '/en/plugins/mui' },
    '/en/learn/editor-plugins-mantine': { status: 301, destination: '/en/plugins/mantine' },
    '/en/learn/editor-plugins.md': { status: 301, destination: '/en/plugins.md' },
    '/en/learn/editor-plugins-custom.md': { status: 301, destination: '/en/plugins/custom.md' },
    '/en/learn/editor-plugins-antd.md': { status: 301, destination: '/en/plugins/antd.md' },
    '/en/learn/editor-plugins-shadcn.md': { status: 301, destination: '/en/plugins/shadcn.md' },
    '/en/learn/editor-plugins-mui.md': { status: 301, destination: '/en/plugins/mui.md' },
    '/en/learn/editor-plugins-mantine.md': { status: 301, destination: '/en/plugins/mantine.md' },
  },
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
      include: [
        '@ant-design/icons',
        '@beautifuljs/grid-mantine',
        '@beautifuljs/grid-mui',
        '@mantine/core',
        '@mantine/dates',
        '@mui/material',
        '@mui/x-date-pickers',
        '@radix-ui/react-popover',
        '@radix-ui/react-select',
        '@radix-ui/react-slot',
        'antd',
        'class-variance-authority',
        'dayjs',
        'lucide-react',
        'uuid',
      ],
    },
    resolve: {
      // Demo and library modules are imported from the repository root, which
      // also has React installed. Keep every island and AntD portal on the
      // site's React and design-system instances so context-backed plugin
      // editors keep their providers when demos are imported from the root.
      dedupe: [
        'react',
        'react-dom',
        '@emotion/react',
        '@emotion/styled',
        '@mantine/core',
        '@mantine/dates',
        '@mui/material',
        '@mui/x-date-pickers',
      ],
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
