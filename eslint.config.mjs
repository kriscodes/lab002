import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']),
  js.configs.recommended,
  typescript.configs.recommended,
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    extends: [next.configs['core-web-vitals'], reactHooks.configs.flat.recommended],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['tests/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
]);
