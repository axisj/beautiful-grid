const path = require('node:path');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [tailwindcss(path.join(__dirname, 'tailwind.config.cjs')), autoprefixer],
};
