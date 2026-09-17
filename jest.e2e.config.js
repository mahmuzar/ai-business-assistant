import { fileURLToPath } from 'url';
import { dirname } from 'path';
import baseConfig from './jest.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  ...baseConfig,
  rootDir: __dirname,
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
  coverageDirectory: '<rootDir>/coverage/e2e',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/integration/helpers/test-containers.setup.ts',
  testTimeout: 60000,
};

export default config;