// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import thunderIdPlugin from '@thunderid/eslint-plugin';

export default [
  {
    ignores: ['node_modules/**'],
  },
  ...thunderIdPlugin.configs.typescript,
  {
    // Node runs src/server.ts directly (type stripping), which needs the `.ts` extension on
    // relative imports.
    files: ['src/**/*.ts'],
    rules: {
      'import-x/extensions': 'off',
    },
  },
  {
    // The explorer UI is plain browser JavaScript, served as is.
    files: ['public/**/*.js'],
    languageOptions: {
      globals: Object.fromEntries(
        ['URL', 'URLSearchParams', 'document', 'fetch', 'history', 'location', 'navigator', 'setTimeout', 'window'].map(
          (name) => [name, 'readonly'],
        ),
      ),
    },
  },
];
