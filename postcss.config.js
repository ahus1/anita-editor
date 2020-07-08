module.exports = {
  plugins: {
    tailwindcss: {},
    'vue-cli-plugin-tailwind/purgecss': {
      whitelistPatternsChildren: [/ace/, /fa/],
    },
    autoprefixer: {},
    precss: {},
    'postcss-import': {},
    cssnano: {
      preset: 'default',
    },
  },
};
