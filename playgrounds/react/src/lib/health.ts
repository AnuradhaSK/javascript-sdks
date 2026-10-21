// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useSyncExternalStore} from 'react';
import {describeError, logEvent} from './events';
import playgroundConfig from '../config';

export interface ServerHealth {
  checkedAt: number | null;
  detail: string;
  state: 'unknown' | 'up' | 'down';
}

let health: ServerHealth = {checkedAt: null, detail: 'not checked', state: 'unknown'};
const listeners = new Set<() => void>();

const setHealth = (next: ServerHealth): void => {
  health = next;
  listeners.forEach((listener: () => void) => listener());
};

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

    setHealth(next);
    logEvent('server:health', `${next.detail} (${url})`, response.ok ? 'ok' : 'error');

    return next;
  } catch (error) {
    const next: ServerHealth = {
      checkedAt: Date.now(),
      detail: `unreachable: ${describeError(error)}`,
      state: 'down',
    };

    setHealth(next);
    logEvent('server:health', next.detail, 'error');

    return next;
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): ServerHealth => health;

export const useServerHealth = (): ServerHealth => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
