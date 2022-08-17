export default {
  collectCoverage: true,
  collectCoverageFrom: [
    `src/**/*.(js|ts)`,
    '!**/(node_modules|dist|local)/**',
    '!src/ts/icons/**/*.(js|ts)',
    '!src/ts/editor/**/*.(js|ts)',
    // there is no actual code despite
    // coverage reporting a line
    '!src/ts/parser/contexts.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['json-summary', 'text', 'lcov'],
  transform: {
    '^.+\\.[t|j]s$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|svg)$': 'jest-transform-stub',
  },
  testEnvironment: 'jsdom',
};
