// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useSyncExternalStore} from 'react';

export type Section = 'overview' | 'components' | 'hooks' | 'tokens';

const subscribe = (listener: () => void): (() => void) => {
  window.addEventListener('hashchange', listener);

  return () => window.removeEventListener('hashchange', listener);
};

const getSnapshot = (): string => window.location.hash.replace(/^#\/?/, '');

/**
 * A tiny hash router. Returns the path segments after `#/`.
 */
export const useHashPath = (): string[] => {
  const hash: string = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return hash.split('/').filter(Boolean).map(decodeURIComponent);
};

export const href = (...segments: string[]): string => `#/${segments.map(encodeURIComponent).join('/')}`;
