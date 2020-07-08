module.exports = {
  purge: [
    './src/**/*.html',
    './src/**/*.vue',
  ],
  theme: {
    extend: {},
  },
  options: {
    whitelistPatternsChildren: [/ace/, /fa/],
  },
  variants: {},
  plugins: [],
};
