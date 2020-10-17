module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    `src/**/*.js`,
    '!**/(node_modules|dist|local)/**',
    '!src/js/icons/**/*.js',
    '!src/js/editor/**/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 80,
      statements: 90,
    },
  },
  coverageReporters: ['json-summary', 'text', 'lcov'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|svg)$':
      'jest-transform-stub',
  },
};
