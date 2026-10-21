// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, describe, expect, it, vi} from 'vitest';
import type {ThunderIDVueConfig} from '../../models/config';
import ThunderIDVueClient from '../../ThunderIDVueClient';

describe('ThunderIDVueClient.getDiscoveryResponse', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('returns null before the client is initialized', async () => {
    expect(await new ThunderIDVueClient(41).getDiscoveryResponse()).toBeNull();
  });

  it('fetches the discovery document when it has not been loaded yet', async () => {
    const baseUrl = 'https://idp.example.com';
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            authorization_endpoint: `${baseUrl}/oauth2/authorize`,
            issuer: baseUrl,
            token_endpoint: `${baseUrl}/oauth2/token`,
          }),
          {headers: {'Content-Type': 'application/json'}, status: 200},
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new ThunderIDVueClient(42);
    await client.initialize({
      afterSignInUrl: window.location.origin,
      baseUrl,
      clientId: 'discovery-test-client',
      storage: 'sessionStorage',
    } as ThunderIDVueConfig);

    const discovery = await client.getDiscoveryResponse();

    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/.well-known/openid-configuration`);
    expect(discovery?.issuer).toBe(baseUrl);

    await client.getDiscoveryResponse();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
