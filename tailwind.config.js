module.exports = {
  purge: {
    content: ['./public/**/*.html', './src/**/*.{vue,js}'],
    options: {
      safelist: [],
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
