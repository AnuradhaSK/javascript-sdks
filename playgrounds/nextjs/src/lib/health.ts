// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {useSyncExternalStore} from 'react';
import {describeError, logEvent} from './events';
import {HealthResult, probeServer} from '../app/actions';

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
 * Asks the Next.js server to probe the ThunderID liveness endpoint.
 */
export const checkServerHealth = async (): Promise<ServerHealth> => {
  try {
    const result: HealthResult = await probeServer();
    const next: ServerHealth = {checkedAt: Date.now(), detail: result.detail, state: result.state};

    setHealth(next);
    logEvent('server:health', `${result.detail} (${result.url})`, result.state === 'up' ? 'ok' : 'error');

    return next;
  } catch (error) {
    const next: ServerHealth = {checkedAt: Date.now(), detail: describeError(error), state: 'down'};

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
