module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    // Image / asset files
    '\\.(png|jpg|jpeg|gif|svg|webp|ttf|woff|woff2)$': '<rootDir>/src/__mocks__/fileMock.js',
    // Ignore React Native / Expo modules not needed for pure logic tests
    '^react-native$': '<rootDir>/src/__mocks__/react-native.js',
    '^expo-.*$': '<rootDir>/src/__mocks__/expo.js',
    '^@env$': '<rootDir>/src/__mocks__/env.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json', diagnostics: false }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(lunar-javascript)/)',
  ],
};
