// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {Application, ApplicationSubmission, CreateApplicationRequest, OAuth2Config} from '../../models/application';
import toUpdateApplicationRequest from '../toUpdateApplicationRequest';

const submission: ApplicationSubmission = {
  description: 'Storefront',
  grantTypes: ['authorization_code', 'refresh_token'],
  logoUrl: 'https://cdn.example.com/logo.png',
  name: 'My SPA',
  redirectUris: ['https://app.example.com/callback'],
  url: 'https://app.example.com',
};

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

// The request types omit keys from a type with an index signature, so their known fields read as
// `unknown`; read the OAuth configuration back through the application shape.
const oauthConfig = (request: CreateApplicationRequest): OAuth2Config | undefined =>
  (request as Pick<Application, 'inboundAuthConfig'>).inboundAuthConfig?.[0]?.config;

describe('toUpdateApplicationRequest', () => {
  it('applies the form values, keeps the untouched fields and leaves out what the server sets', () => {
    const request = toUpdateApplicationRequest(application, {
      ...submission,
      grantTypes: ['client_credentials'],
      redirectUris: [],
    });

    expect(request).not.toHaveProperty('id');
    expect(request).not.toHaveProperty('createdAt');
    expect(request).not.toHaveProperty('updatedAt');
    expect(request).not.toHaveProperty('status');
    expect(request).toMatchObject({
      description: 'Storefront',
      logoUrl: 'https://cdn.example.com/logo.png',
      name: 'My SPA',
      ouId: 'ou-1',
      themeId: 'theme-1',
      url: 'https://app.example.com',
    });
    expect(oauthConfig(request)).toEqual({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      grantTypes: ['client_credentials'],
      redirectUris: [],
      responseTypes: ['id_token'],
      tokenEndpointAuthMethod: 'client_secret_basic',
    });
  });

  it('ignores publicClient, which can only be set on create', () => {
    const request = toUpdateApplicationRequest(application, {...submission, publicClient: true});

    expect(oauthConfig(request)?.publicClient).toBeUndefined();
  });
});
