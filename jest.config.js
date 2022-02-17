module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/tests/unit/__mocks__/styleMock.js',
  },
};
