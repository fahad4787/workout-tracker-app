/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff2d95',
          cyan: '#00f5ff',
          lime: '#b8ff00',
          purple: '#a855f7',
        },
      },
    },
  },
  plugins: [],
};
