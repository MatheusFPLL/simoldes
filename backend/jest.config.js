module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/config/',
        '/migrations/'
    ],
    setupFilesAfterEnv: ['./jest.setup.js']
};