module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'linebreak-style': 'off',
    'no-restricted-syntax': 'off',
    'no-restricted-globals': ["error", "history"],
    'no-labels': 'off',
    'global-require': 'off',
    'no-param-reassign': ["error", { "props": false }],
    'no-continue': 'off',
    'no-await-in-loop': 'off',
    'max-len': 'off',
    'no-nested-ternary': 'off',
    'no-plusplus': ["error", { "allowForLoopAfterthoughts": true }]
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
