// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useSyncExternalStore} from 'react';

export type EventKind = 'ok' | 'error' | 'info';

export interface PlaygroundEvent {
  detail: string;
  id: number;
  kind: EventKind;
  name: string;
  time: string;
}

const MAX_EVENTS = 200;

let events: PlaygroundEvent[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = (): void => listeners.forEach((listener: () => void) => listener());

export const timestamp = (): string => {
  const now: Date = new Date();

  return `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

export const logEvent = (name: string, detail = '', kind: EventKind = 'info'): void => {
  events = [{detail, id: nextId, kind, name, time: timestamp()}, ...events].slice(0, MAX_EVENTS);
  nextId += 1;
  emit();
};

export const clearEvents = (): void => {
  events = [];
  emit();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): PlaygroundEvent[] => events;

export const useEvents = (): PlaygroundEvent[] => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

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
 * Runs an SDK call and records started, completed, and failed events for it. The React SDK has no
 * public event subscription, so the playground instruments the calls it makes instead.
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
