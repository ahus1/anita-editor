module.exports = {
  plugins: {
    tailwindcss: {
      future: {
        defaultLineHeights: true,
        standardFontWeights: true,
        removeDeprecatedGapUtilities: true,
        purgeLayersByDefault: true,
      },
    },
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
