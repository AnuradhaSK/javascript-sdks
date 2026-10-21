// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describeError, logEvent} from './events';
import {createStore, Store} from './store';
import playgroundConfig from '../config';

export interface ServerHealth {
  checkedAt: number | null;
  detail: string;
  state: 'unknown' | 'up' | 'down';
}

export const healthStore: Store<ServerHealth> = createStore<ServerHealth>({
  checkedAt: null,
  detail: 'not checked',
  state: 'unknown',
});

/**
 * Probes the ThunderID liveness endpoint. This is a plain fetch, not an SDK call.
 */
export const checkServerHealth = async (): Promise<ServerHealth> => {
  const url = `${playgroundConfig.baseUrl}/health/liveness`;
  let next: ServerHealth;

  try {
    const response: Response = await fetch(url, {cache: 'no-store'});

    next = {
      checkedAt: Date.now(),
      detail: response.ok ? 'healthy' : `HTTP ${response.status}`,
      state: response.ok ? 'up' : 'down',
    };
    logEvent('server:health', `${next.detail} (${url})`, response.ok ? 'ok' : 'error');
  } catch (error) {
    next = {checkedAt: Date.now(), detail: `unreachable: ${describeError(error)}`, state: 'down'};
    logEvent('server:health', next.detail, 'error');
  }

  healthStore.set(next);

  return next;
};
