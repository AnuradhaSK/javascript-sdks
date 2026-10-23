// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  type AuthorizationDetail,
  type ExtendedAuthorizeRequestUrlParams,
  ThunderIDBrowserClient,
} from '@thunderid/browser';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {ThunderIDVueConfig} from '../../models/config';
import ThunderIDVueClient from '../../ThunderIDVueClient';

const authorizationDetails: AuthorizationDetail[] = [
  {instructedAmount: {amount: '35', currency: 'EUR'}, type: 'payment_initiation'},
];

/** Records the authorize URL the client builds and stops there, since signing in navigates away from the page. */
class RecordingClient extends ThunderIDVueClient {
  public signInUrls: string[] = [];

  protected override async getSignInUrl(
    requestConfig?: ExtendedAuthorizeRequestUrlParams,
    userId?: string,
  ): Promise<string> {
    this.signInUrls.push(await super.getSignInUrl(requestConfig, userId));

    throw new Error('Stopped before the sign-in redirect');
  }
}

describe('ThunderIDVueClient redirect sign-in', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('passes RFC 9396 authorization details to the browser client', async () => {
    const signIn = vi.spyOn(ThunderIDBrowserClient.prototype, 'signIn').mockResolvedValue(undefined);

    await new ThunderIDVueClient().signIn({authorizationDetails});

    expect(signIn).toHaveBeenCalledWith({authorizationDetails});
  });

  it('sends the authorization details JSON-encoded on the authorize request', async () => {
    const client = new RecordingClient(43);
    await client.initialize({
      afterSignInUrl: window.location.origin,
      baseUrl: 'https://example.com',
      clientId: 'authorization-details-client',
      storage: 'sessionStorage',
    } as ThunderIDVueConfig);
    await client.getStorageManager().setOIDCProviderMetaData({
      authorization_endpoint: 'https://example.com/oauth2/authorize',
      token_endpoint: 'https://example.com/oauth2/token',
    });
    await client.getStorageManager().setTemporaryDataParameter('op_config_initiated', true);

    await expect(client.signIn({authorizationDetails})).rejects.toThrow('Stopped before the sign-in redirect');

    const params: URLSearchParams = new URL(client.signInUrls[0]).searchParams;

    expect(JSON.parse(params.get('authorization_details') ?? 'null')).toEqual(authorizationDetails);
    expect(params.has('authorizationDetails')).toBe(false);
  });
});
