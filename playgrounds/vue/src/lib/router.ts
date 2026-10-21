// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {computed, ComputedRef, ref, Ref} from 'vue';

export type Section = 'overview' | 'components' | 'composables' | 'tokens';

const read = (): string => window.location.hash.replace(/^#\/?/, '');

const hash: Ref<string> = ref<string>(read());

window.addEventListener('hashchange', () => {
  hash.value = read();
});

/**
 * A tiny hash router. Returns the path segments after `#/`.
 */
export const hashPath: ComputedRef<string[]> = computed(() =>
  hash.value.split('/').filter(Boolean).map(decodeURIComponent),
);

export const href = (...segments: string[]): string => `#/${segments.map(encodeURIComponent).join('/')}`;
