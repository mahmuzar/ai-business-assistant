import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: __dirname,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|js)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|rxjs)/)',
  ],
  moduleNameMapper: {
    '^@shared/(.*)\\.js$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)\\.js$': '<rootDir>/src/modules/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/main.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'cobertura', 'lcov'],
};

export default config;