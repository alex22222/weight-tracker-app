module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/utils/__tests__/*.test.js',
    '**/pages/**/__tests__/*.test.js'
  ],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'utils/**/*.js',
    '!utils/*.wxs',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['./test/setup.js'],
  testTimeout: 10000,
  verbose: true,
  moduleNameMapper: {
    '^../../utils/util.js$': '<rootDir>/utils/util.js'
  }
};
