// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Storage} from '../models/store';
import StorageManager from '../StorageManager';

class MemoryStore implements Storage {
  private store = new Map<string, string>();

  async getData(key: string): Promise<string> {
    return this.store.get(key) ?? null!;
  }

  async setData(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeData(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('StorageManager', () => {
  const original: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  afterEach(() => {
    if (original) {
      Object.defineProperty(globalThis, 'localStorage', original);
    } else {
      delete (globalThis as {localStorage?: unknown}).localStorage;
    }
  });

  it('keeps hybrid data in the given store without touching localStorage outside a browser window', async () => {
    const read = vi.fn((): undefined => undefined);
    Object.defineProperty(globalThis, 'localStorage', {configurable: true, get: read});
    const manager: StorageManager<unknown> = new StorageManager<unknown>('instance_0', new MemoryStore());

    await manager.setHybridDataParameter('pkce_code_verifier#0', 'verifier', 'session-1');

    expect(await manager.getHybridDataParameter('pkce_code_verifier#0', 'session-1')).toBe('verifier');
    expect(read).not.toHaveBeenCalled();
  });
});
