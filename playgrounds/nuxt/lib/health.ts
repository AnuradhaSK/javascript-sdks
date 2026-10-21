// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {shallowRef, type ShallowRef} from 'vue';
import {describeError, logEvent} from './events';
import type {PlaygroundHealth} from './types';

export interface ServerHealth {
  checkedAt: number | null;
  detail: string;
  state: 'unknown' | 'up' | 'down';
}

export const health: ShallowRef<ServerHealth> = shallowRef<ServerHealth>({
  checkedAt: null,
  detail: 'not checked',
  state: 'unknown',
});

/**
 * Asks the Nuxt server to probe the ThunderID liveness endpoint (`GET /api/playground/health`).
 */
export const checkServerHealth = async (): Promise<ServerHealth> => {
  try {
    const result: PlaygroundHealth = await $fetch<PlaygroundHealth>('/api/playground/health');

    health.value = {checkedAt: Date.now(), detail: result.detail, state: result.state};
    logEvent('server:health', `${result.detail} (${result.url})`, result.state === 'up' ? 'ok' : 'error');
  } catch (error) {
    health.value = {checkedAt: Date.now(), detail: `health route failed: ${describeError(error)}`, state: 'down'};
    logEvent('server:health', health.value.detail, 'error');
  }

  return health.value;
};
