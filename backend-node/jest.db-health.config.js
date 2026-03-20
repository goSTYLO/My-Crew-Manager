export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/integration/database.health.test.js'],
  setupFiles: ['<rootDir>/src/__tests__/setup-db-health.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup-after-env.js'],
  testTimeout: 60000,
  verbose: true,
};
