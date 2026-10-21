// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    // The playground bundles the whole SDK on purpose; it is never shipped.
    chunkSizeWarningLimit: 1500,
  },
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
