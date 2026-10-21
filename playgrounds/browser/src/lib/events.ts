// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {createStore, Store} from './store';

export type EventKind = 'ok' | 'error' | 'info';

export interface PlaygroundEvent {
  detail: string;
  id: number;
  kind: EventKind;
  name: string;
  time: string;
}

const MAX_EVENTS = 200;

let nextId = 1;

export const eventStore: Store<PlaygroundEvent[]> = createStore<PlaygroundEvent[]>([]);

export const timestamp = (): string => {
  const now: Date = new Date();

  return `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

export const logEvent = (name: string, detail = '', kind: EventKind = 'info'): void => {
  eventStore.set([{detail, id: nextId, kind, name, time: timestamp()}, ...eventStore.get()].slice(0, MAX_EVENTS));
  nextId += 1;
};

export const clearEvents = (): void => eventStore.set([]);

export const describeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

/**
 * Runs an SDK call and records started, completed, and failed events for it. Lifecycle events from
 * the client itself arrive separately through `client.on()`; see `client.ts`.
 */
export const track = async <T>(name: string, call: () => Promise<T>, describe?: (result: T) => string): Promise<T> => {
  logEvent(`${name}:started`, '', 'info');

  try {
    const result: T = await call();

    logEvent(`${name}:completed`, describe ? describe(result) : '', 'ok');

    return result;
  } catch (error) {
    logEvent(`${name}:failed`, describeError(error), 'error');
    throw error;
  }
};
