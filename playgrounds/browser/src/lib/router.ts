// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type Section = 'overview' | 'helpers' | 'tokens';

/**
 * Returns the path segments after `#/`.
 */
export const currentPath = (): string[] =>
  window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

export const toSection = (segment: string | undefined): Section =>
  segment === 'helpers' || segment === 'tokens' ? segment : 'overview';

export const href = (...segments: string[]): string => `#/${segments.map(encodeURIComponent).join('/')}`;
