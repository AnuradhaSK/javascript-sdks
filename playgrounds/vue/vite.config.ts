// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    // The playground bundles the whole SDK on purpose; it is never shipped.
    chunkSizeWarningLimit: 1500,
  },
  plugins: [vue()],
  server: {
    port: 5174,
    strictPort: true,
  },
});
