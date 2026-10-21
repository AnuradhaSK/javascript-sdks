// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {shallowRef, type ShallowRef} from 'vue';

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

/**
 * The SDK event log. It lives in the browser only: module state on the server would be shared by
 * every request, so server-side calls are ignored.
 */
export const events: ShallowRef<PlaygroundEvent[]> = shallowRef<PlaygroundEvent[]>([]);

export const timestamp = (): string => {
  const now: Date = new Date();

  return `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

export const logEvent = (name: string, detail = '', kind: EventKind = 'info'): void => {
  if (import.meta.server) return;

  events.value = [{detail, id: nextId, kind, name, time: timestamp()}, ...events.value].slice(0, MAX_EVENTS);
  nextId += 1;
};

export const clearEvents = (): void => {
  events.value = [];
};

export const describeError = (error: unknown): string => {
  const data: unknown = (error as {data?: unknown})?.data;
  const statusMessage: unknown = (data as {statusMessage?: unknown} | undefined)?.statusMessage;

  if (typeof statusMessage === 'string') {
    const statusCode: unknown = (data as {statusCode?: unknown}).statusCode;

    return typeof statusCode === 'number' ? `${statusCode} ${statusMessage}` : statusMessage;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

/**
 * Runs an SDK call and records started, completed, and failed events for it. The Nuxt module has no
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
