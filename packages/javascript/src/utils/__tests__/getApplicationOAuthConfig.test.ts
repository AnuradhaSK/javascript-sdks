// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {Application} from '../../models/application';
import getApplicationOAuthConfig from '../getApplicationOAuthConfig';

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

describe('getApplicationOAuthConfig', () => {
  it('returns the OAuth configuration of an application', () => {
    expect(getApplicationOAuthConfig(application)?.clientId).toBe('client-1');
  });

  it('returns undefined for an application without an OAuth client', () => {
    expect(getApplicationOAuthConfig({inboundAuthConfig: []})).toBeUndefined();
    expect(getApplicationOAuthConfig(undefined)).toBeUndefined();
  });
});
