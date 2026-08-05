/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  ignorePatterns: ['dist', 'node_modules', '*.config.*'],
  rules: {
    // Allow a leading underscore to mark an intentionally-unused arg/var,
    // e.g. a type-predicate parameter (`(x: any): x is Foo`) or a
    // destructured field kept only to omit it from a rest spread.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Pre-existing debt: 33 `any` usages across D3 selection code
    // (SimpleGraph.tsx), sample-data fixtures, and test mocks would need
    // real type modeling to remove safely. Disabling rather than leaving
    // this as an unenforced rule; revisit incrementally rather than as a
    // blanket lint-driven rewrite.
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      // Vite fast-refresh only reloads a module cleanly when it exports only
      // components; scoped to .tsx since non-component files (stores, utils)
      // legitimately mix exports.
      files: ['**/*.tsx'],
      rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
    {
      // Test files run under vitest's `globals: true` (see vitest.config.ts),
      // so describe/it/expect/etc. are available without an import.
      files: ['**/*.test.ts', '**/*.test.tsx', 'src/setupTests.ts'],
      env: { node: true },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  ],
};
