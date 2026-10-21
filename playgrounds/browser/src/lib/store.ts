// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export type Listener = () => void;

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: Listener) => () => void;
}

/**
 * A minimal observable value. The playground has no framework, so views subscribe to these and
 * re-render the part of the page they own.
 */
export const createStore = <T>(initial: T): Store<T> => {
  let value: T = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      listeners.forEach((listener: Listener) => listener());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/**
 * Collects teardown callbacks for a view so they run together when the view is replaced.
 */
export class Scope {
  private cleanups: (() => void)[] = [];

  public add(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  public interval(callback: () => void, ms: number): void {
    const timer: number = window.setInterval(callback, ms);

    this.add(() => window.clearInterval(timer));
  }

  public dispose(): void {
    this.cleanups.splice(0).forEach((cleanup: () => void) => cleanup());
  }
}
