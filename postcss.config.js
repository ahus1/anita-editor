module.exports = {
  plugins: {
    tailwindcss: {},
    'vue-cli-plugin-tailwind/purgecss': {
      whitelistPatternsChildren: [/ace/, /fa/, /^del$/, /^ins$/, /^ins.mod$/],
    },
    autoprefixer: {},
    precss: {},
    'postcss-import': {},
    cssnano: {
      preset: 'default',
    },
  },
};
