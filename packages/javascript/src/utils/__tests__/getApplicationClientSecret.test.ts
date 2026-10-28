// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {Application} from '../../models/application';
import getApplicationClientSecret from '../getApplicationClientSecret';

const application: Application = {
  createdAt: '2026-01-01T00:00:00Z',
  id: 'app-1',
  inboundAuthConfig: [
    {
      config: {
        clientId: 'client-1',
        clientSecret: 'secret-1',
        grantTypes: ['authorization_code'],
        redirectUris: ['https://old.example.com/callback'],
        responseTypes: ['code', 'id_token'],
        tokenEndpointAuthMethod: 'client_secret_basic',
      },
      type: 'oauth2',
    },
  ],
  name: 'Old name',
  ouId: 'ou-1',
  status: {value: 'ACTIVE'},
  themeId: 'theme-1',
  updatedAt: '2026-01-02T00:00:00Z',
};

describe('getApplicationClientSecret', () => {
  it('returns the client secret the server returned', () => {
    expect(getApplicationClientSecret(application)).toBe('secret-1');
  });

  it('treats an empty or missing secret as no secret', () => {
    expect(
      getApplicationClientSecret({
        id: 'a',
        inboundAuthConfig: [{config: {clientSecret: ''}, type: 'oauth2'}],
        name: 'A',
      }),
    ).toBeUndefined();
    expect(getApplicationClientSecret({id: 'a', name: 'A'})).toBeUndefined();
  });
});
