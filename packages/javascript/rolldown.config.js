// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {readFileSync} from 'fs';
import {join} from 'path';
import {defineConfig} from 'rolldown';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

// A dependency's subpath imports (for example `jose/jwt/verify`) stay external too.
const external = (id) => dependencies.some((dep) => id === dep || id.startsWith(`${dep}/`));

const commonOptions = {
  input: [join('src', 'index.ts')],
  preserveModules: true,
  external,
  platform: 'node',
  target: 'es2020',
  sourcemap: true,
};

export default defineConfig([
  // ESM build
  {
    ...commonOptions,
    output: {
      dir: 'dist',
      format: 'esm',
      preserveModulesRoot: 'src',
    },
  },
  // CommonJS build
  {
    ...commonOptions,
    output: {
      dir: join('dist', 'cjs'),
      entryFileNames: '[name].cjs',
      format: 'cjs',
      preserveModulesRoot: 'src',
    },
  },
  // Edge build (browser platform; process.versions undefined so isNode() returns false)
  {
    ...commonOptions,
    platform: 'browser',
    define: {
      'process.versions': 'undefined',
    },
    output: {
      dir: join('dist', 'edge'),
      format: 'esm',
      preserveModulesRoot: 'src',
    },
  },
]);
