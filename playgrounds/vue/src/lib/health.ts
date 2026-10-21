// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {readonly, shallowRef, ShallowRef} from 'vue';
import {describeError, logEvent} from './events';
import playgroundConfig from '../config';

export interface ServerHealth {
  checkedAt: number | null;
  detail: string;
  state: 'unknown' | 'up' | 'down';
}

const health: ShallowRef<ServerHealth> = shallowRef<ServerHealth>({
  checkedAt: null,
  detail: 'not checked',
  state: 'unknown',
});

export const serverHealth: Readonly<ShallowRef<ServerHealth>> = readonly(health) as Readonly<ShallowRef<ServerHealth>>;

/**
 * Probes the ThunderID liveness endpoint. This is a plain fetch, not an SDK call.
 */
export const checkServerHealth = async (): Promise<ServerHealth> => {
  const url = `${playgroundConfig.baseUrl}/health/liveness`;

  try {
    const response: Response = await fetch(url, {cache: 'no-store'});
    const next: ServerHealth = {
      checkedAt: Date.now(),
      detail: response.ok ? 'healthy' : `HTTP ${response.status}`,
      state: response.ok ? 'up' : 'down',
    };

    health.value = next;
    logEvent('server:health', `${next.detail} (${url})`, response.ok ? 'ok' : 'error');

    return next;
  } catch (error) {
    const next: ServerHealth = {
      checkedAt: Date.now(),
      detail: `unreachable: ${describeError(error)}`,
      state: 'down',
    };

    health.value = next;
    logEvent('server:health', next.detail, 'error');

    return next;
  }
};
