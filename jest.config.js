const srcDirs = ['events', 'frontend', 'lib', 'tasks']

const browserScripts = ['arkose_verify', 'ark_sandbox', 'arkose_test_frontend']

module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        `src/(${srcDirs.join('|')})/**/!(${browserScripts.join('|')}).js`,
        '!src/frontend/lib/web_crypto/**', // Impossible to test in Jest
        '!src/tasks/lib/fetch.js', // Will not cover
        '!src/tasks/admin*/index.js', // Will cover admin tasks in future
        '!**/(node_modules|dist|local)/**',
    ],
    coverageThreshold: {
        global: {
            branches: 75, // Most branches amount to !PROD branches, which we don't care to test
            functions: 90,
            lines: 80,
            statements: 90,
        },
    },
    coverageReporters: ['json-summary', 'text', 'lcov'],
    extraGlobals: ['Math'],
    setupFiles: ['jest-canvas-mock'],
}
