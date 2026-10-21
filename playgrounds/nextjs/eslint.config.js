// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import thunderIdPlugin from '@thunderid/eslint-plugin';

export default [
  {
    ignores: ['.next/**', 'next-env.d.ts', 'node_modules/**', 'coverage/**'],
  },
  ...thunderIdPlugin.configs.react,
  {
    // Next.js route files export route config (`dynamic`, `metadata`) next to the component, and
    // Next.js handles their refresh itself.
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
