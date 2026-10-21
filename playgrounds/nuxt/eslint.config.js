// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import thunderIdPlugin from '@thunderid/eslint-plugin';

// The block of the TypeScript config that turns type-aware linting off for plain JavaScript files.
// The Vue config sets type-aware parser options for every file, so it is applied again last.
const untypedJavaScript = thunderIdPlugin.configs.typescript.find((config) =>
  config.files?.includes('**/*.{js,jsx,cjs,mjs}'),
);

export default [
  {
    ignores: ['.nuxt/**', '.output/**', 'node_modules/**', 'coverage/**'],
  },
  ...thunderIdPlugin.configs.typescript,
  ...thunderIdPlugin.configs.vue,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.vue'],
      },
    },
  },
  untypedJavaScript,
];
