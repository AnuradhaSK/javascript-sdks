// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDBrowserClient} from '@thunderid/browser';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDReactClient from '../ThunderIDReactClient';

const CONFIG = {baseUrl: 'https://localhost:8090', clientId: 'config-recovery-client'};

const configKeys = (): string[] => Object.keys(sessionStorage).filter((key: string) => key.startsWith('config_data'));

describe('ThunderIDReactClient config recovery', () => {
  let client: ThunderIDReactClient;

  beforeEach(async () => {
    sessionStorage.clear();
    client = new ThunderIDReactClient();
    await client.initialize(CONFIG as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('re-initializes before a silent sign-in when the stored config was lost', async () => {
    const silent = vi.spyOn(ThunderIDBrowserClient.prototype, 'signInSilently').mockResolvedValue(false);
    configKeys().forEach((key: string) => sessionStorage.removeItem(key));

    await client.signInSilently();

    expect(silent).toHaveBeenCalledOnce();
    expect(((await client.getStorageManager().getConfigData()) as any)?.baseUrl).toBe(CONFIG.baseUrl);
  });

  it('re-initializes before a silent sign-in when the stored config lost its baseUrl', async () => {
    vi.spyOn(ThunderIDBrowserClient.prototype, 'signInSilently').mockResolvedValue(false);
    await client.getStorageManager().removeConfigDataParameter('baseUrl' as any);

    await client.signInSilently();

    expect(((await client.getStorageManager().getConfigData()) as any)?.baseUrl).toBe(CONFIG.baseUrl);
  });

  it('leaves an intact config alone', async () => {
    vi.spyOn(ThunderIDBrowserClient.prototype, 'signInSilently').mockResolvedValue(false);
    const initialize = vi.spyOn(client, 'initialize');

    await client.signInSilently();

    expect(initialize).not.toHaveBeenCalled();
  });
});
