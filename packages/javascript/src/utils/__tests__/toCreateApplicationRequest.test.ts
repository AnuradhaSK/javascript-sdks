// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {Application, ApplicationSubmission, CreateApplicationRequest, OAuth2Config} from '../../models/application';
import toCreateApplicationRequest from '../toCreateApplicationRequest';

const submission: ApplicationSubmission = {
  description: 'Storefront',
  grantTypes: ['authorization_code', 'refresh_token'],
  logoUrl: 'https://cdn.example.com/logo.png',
  name: 'My SPA',
  redirectUris: ['https://app.example.com/callback'],
  url: 'https://app.example.com',
};

// The request types omit keys from a type with an index signature, so their known fields read as
// `unknown`; read the OAuth configuration back through the application shape.
const oauthConfig = (request: CreateApplicationRequest): OAuth2Config | undefined =>
  (request as Pick<Application, 'inboundAuthConfig'>).inboundAuthConfig?.[0]?.config;

describe('toCreateApplicationRequest', () => {
  it('builds a confidential OAuth client by default', () => {
    expect(toCreateApplicationRequest(submission, 'ou-1')).toEqual({
      description: 'Storefront',
      inboundAuthConfig: [
        {
          config: {
            grantTypes: ['authorization_code', 'refresh_token'],
            pkceRequired: undefined,
            publicClient: false,
            redirectUris: ['https://app.example.com/callback'],
            responseTypes: ['code'],
            tokenEndpointAuthMethod: 'client_secret_basic',
          },
          type: 'oauth2',
        },
      ],
      logoUrl: 'https://cdn.example.com/logo.png',
      name: 'My SPA',
      ouId: 'ou-1',
      url: 'https://app.example.com',
    });
  });

  it('builds a public client that must use PKCE and does not authenticate at the token endpoint', () => {
    const config: OAuth2Config | undefined = oauthConfig(
      toCreateApplicationRequest({...submission, publicClient: true}, 'ou-1'),
    );

    expect(config).toMatchObject({pkceRequired: true, publicClient: true, tokenEndpointAuthMethod: 'none'});
  });

  it('sets no code response type without the authorization code grant', () => {
    const config: OAuth2Config | undefined = oauthConfig(
      toCreateApplicationRequest({...submission, grantTypes: ['client_credentials']}, 'ou-1'),
    );

    expect(config?.responseTypes).toEqual([]);
  });
});
