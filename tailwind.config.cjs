/** @type {import('tailwindcss').Config} */
const path = require('node:path');

module.exports = {
  content: {
    relative: true,
    files: [
      path.join(__dirname, 'src/**/*.{ts,tsx,js,jsx}'),
      path.join(__dirname, 'components/**/*.{ts,tsx,js,jsx}'),
      path.join(__dirname, 'examples/**/*.{ts,tsx,js,jsx}'),
      path.join(__dirname, 'site/src/**/*.{ts,tsx,js,jsx,astro}'),
      path.join(__dirname, 'index.html'),
    ],
  },
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
