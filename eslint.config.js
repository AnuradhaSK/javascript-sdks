// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import thunderIdPlugin from '@thunderid/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**', 'tests/e2e/.samples/**'],
  },
  ...thunderIdPlugin.configs.typescript,
  {
    // Progress/setup/teardown output is the intended UX for E2E tooling, not stray debug
    // logging — same reasoning thunderid's own tests/e2e applies (no no-console rule there).
    files: ['tests/e2e/**'],
    rules: {
      'no-console': 'off',
    },
  },
];
