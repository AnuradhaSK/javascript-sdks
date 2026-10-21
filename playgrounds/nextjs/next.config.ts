// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // The floating dev indicator covers the explorer sidebar.
  devIndicators: false,
  // Lint runs through the repo's ESLint setup (`pnpm lint`), not through `next build`.
  eslint: {ignoreDuringBuilds: true},
};

export default nextConfig;
