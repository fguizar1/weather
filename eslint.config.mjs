import { defineConfig } from 'eslint/config';
import tsConfig from '@kioutils/lint/ts';

export default defineConfig(
  {
    ignores: [
      'eslint.config.mjs',
      'vitest.config.ts',
      'dist/*',
      'coverage/*',
      'docs/*',
      '.scannerwork/*',
    ],
  },
  ...tsConfig,
);
