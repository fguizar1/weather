import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    reporters: ['junit', 'default', ['vitest-sonar-reporter', { outputFile: 'sonar-report.xml' }]],
    outputFile: 'junit.xml',
    coverage: {
      reportsDirectory: 'coverage',
      provider: 'istanbul',
      reporter: ['text', 'cobertura', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['docs/**', '**/__mocks__/*', 'src/functions/*.js'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
});
