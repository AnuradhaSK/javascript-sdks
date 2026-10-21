// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {randomUUID} from 'node:crypto';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDNodeClient from '../ThunderIDNodeClient';

// The default store is one process-wide cache, so every test uses a session ID of its own.
let s1: string;

const OIDC_META = {issuer: 'https://auth.example.com', token_endpoint: 'https://auth.example.com/oauth2/token'};

const newClient = async (): Promise<any> => {
  const client: any = new ThunderIDNodeClient();
  await client.initialize({baseUrl: 'https://auth.example.com', clientId: 'test-client'});
  await client.getStorageManager().setOIDCProviderMetaData(OIDC_META);
  await client.getStorageManager().setTemporaryDataParameter('op_config_initiated', true);

  return client;
};

const expiredSession = (refreshToken?: string): Record<string, unknown> => ({
  access_token: 'old-at',
  created_at: Date.now() - 120_000,
  expires_in: '60',
  ...(refreshToken ? {refresh_token: refreshToken} : {}),
});

const tokenResponse = (): unknown => ({
  json: () =>
    Promise.resolve({access_token: 'new-at', expires_in: '3600', refresh_token: 'new-rt', token_type: 'Bearer'}),
  ok: true,
  status: 200,
});

describe('ThunderIDNodeClient.isSignedIn', () => {
  beforeEach(() => {
    s1 = randomUUID();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is true for an unexpired access token without a request', async () => {
    const client = await newClient();
    await client.setSession({access_token: 'at', created_at: Date.now(), expires_in: '3600'}, s1);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.isSignedIn(s1)).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes an expired access token when the session has a refresh token', async () => {
    const client = await newClient();
    await client.setSession(expiredSession('old-rt'), s1);
    vi.spyOn(client.authHelper, 'handleTokenResponse').mockImplementation(async () => {
      await client.setSession({access_token: 'new-at', created_at: Date.now(), expires_in: '3600'}, s1);

      return {};
    });
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse());
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.isSignedIn(s1)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('refresh_token=old-rt');
    expect((await client.getStorageManager().getSessionData(s1)).access_token).toBe('new-at');
  });

  it('sends one refresh request for concurrent checks of one session', async () => {
    const client = await newClient();
    await client.setSession(expiredSession('old-rt'), s1);
    vi.spyOn(client.authHelper, 'handleTokenResponse').mockResolvedValue({});
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse());
    vi.stubGlobal('fetch', fetchMock);

    await expect(Promise.all([client.isSignedIn(s1), client.isSignedIn(s1)])).resolves.toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('removes an expired session that has no refresh token', async () => {
    const client = await newClient();
    await client.setSession(expiredSession(), s1);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.isSignedIn(s1)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await client.getStorageManager().getSessionData(s1)).access_token).toBeUndefined();
  });

  it('removes an expired session whose refresh is rejected', async () => {
    const client = await newClient();
    await client.setSession(expiredSession('old-rt'), s1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({error: 'invalid_grant'}),
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      }),
    );

    await expect(client.isSignedIn(s1)).resolves.toBe(false);
    expect((await client.getStorageManager().getSessionData(s1)).access_token).toBeUndefined();
  });

  it('is false for a session that does not exist', async () => {
    const client = await newClient();

    await expect(client.isSignedIn('missing')).resolves.toBe(false);
  });
});
