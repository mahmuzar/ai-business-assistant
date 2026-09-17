import baseConfig from './jest.config.js'; // Теперь это работает!

const config = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  coverageDirectory: 'coverage/unit',
  testEnvironment: 'node',
};

export default config;