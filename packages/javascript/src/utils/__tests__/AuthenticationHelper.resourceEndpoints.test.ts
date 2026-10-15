// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import {describe, expect, it} from 'vitest';
import AuthenticationHelper from '../AuthenticationHelper';

/**
 * Builds an AuthenticationHelper backed by a minimal storage-manager stub that only needs to
 * surface config data for the endpoint-resolution methods under test.
 */
const createHelper = (config: any): AuthenticationHelper<any> => {
  const storageManager: any = {
    getConfigData: async () => config,
  };

  return new AuthenticationHelper<any>(storageManager, {} as any);
};

// Resource-server override keys in both camelCase (config form) and snake_case (metadata form);
// none of these should ever appear in the resolved OIDC provider metadata.
const RESOURCE_KEY_FORMS: string[] = [
  'flowExecute',
  'flowMeta',
  'usersMe',
  'usersMeMeta',
  'usersMeCredentials',
  'flow_execute',
  'flow_meta',
  'users_me',
  'users_me_meta',
  'users_me_credentials',
];

describe('AuthenticationHelper resource-endpoint filtering', (): void => {
  it('keeps resource-server endpoint overrides out of the OIDC provider metadata', async (): Promise<void> => {
    const helper: AuthenticationHelper<any> = createHelper({
      baseUrl: 'https://idp.example.com',
      endpoints: {
        // OIDC/OAuth override — kept.
        authorization: 'https://idp.example.com/custom/authorize',
        // Resource-server overrides — must NOT leak into OIDC metadata.
        flowExecute: 'https://rs.example.com/flow/execute',
        flowMeta: 'https://rs.example.com/flow/meta',
        usersMe: 'https://rs.example.com/users/me',
        usersMeCredentials: 'https://rs.example.com/users/me/update-credentials',
        usersMeMeta: 'https://rs.example.com/users/me/meta',
      },
    });

    const resolved: Record<string, unknown> = (await helper.resolveEndpointsByBaseURL()) as Record<string, unknown>;

    // OIDC endpoint resolution still runs and derives the standard endpoints from baseUrl.
    expect(resolved['token_endpoint']).toBe('https://idp.example.com/oauth2/token');
    // The OIDC override is still carried through.
    expect(resolved['authorization']).toBe('https://idp.example.com/custom/authorize');

    // Resource-server overrides are absent from OIDC metadata (neither camelCase nor snake_case).
    RESOURCE_KEY_FORMS.forEach((key: string) => expect(resolved).not.toHaveProperty(key));
  });

  it('excludes resource-server overrides in resolveEndpoints while preserving OIDC overrides', async (): Promise<void> => {
    const helper: AuthenticationHelper<any> = createHelper({
      baseUrl: 'https://idp.example.com',
      endpoints: {
        authorization: 'https://idp.example.com/custom/authorize',
        flowExecute: 'https://rs.example.com/flow/execute',
        flowMeta: 'https://rs.example.com/flow/meta',
        usersMe: 'https://rs.example.com/users/me',
        usersMeCredentials: 'https://rs.example.com/users/me/update-credentials',
        usersMeMeta: 'https://rs.example.com/users/me/meta',
      },
    });

    const resolved: Record<string, unknown> = (await helper.resolveEndpoints({
      token_endpoint: 'https://idp.example.com/oauth2/token',
    })) as Record<string, unknown>;

    // The discovery response value is preserved and the OIDC override is merged in.
    expect(resolved['token_endpoint']).toBe('https://idp.example.com/oauth2/token');
    expect(resolved['authorization']).toBe('https://idp.example.com/custom/authorize');
    RESOURCE_KEY_FORMS.forEach((key: string) => expect(resolved).not.toHaveProperty(key));
  });

  it('excludes resource-server overrides in resolveEndpointsExplicitly', async (): Promise<void> => {
    const helper: AuthenticationHelper<any> = createHelper({
      endpoints: {
        // Explicit resolution requires every OIDC endpoint to be present (snake_cased storage keys).
        authorizationEndpoint: 'https://idp.example.com/oauth2/authorize',
        endSessionEndpoint: 'https://idp.example.com/oauth2/logout',
        issuer: 'https://idp.example.com',
        jwksUri: 'https://idp.example.com/oauth2/jwks',
        revocationEndpoint: 'https://idp.example.com/oauth2/revoke',
        tokenEndpoint: 'https://idp.example.com/oauth2/token',
        userinfoEndpoint: 'https://idp.example.com/oauth2/userinfo',
        // Resource-server overrides — must NOT leak into OIDC metadata.
        flowExecute: 'https://rs.example.com/flow/execute',
        flowMeta: 'https://rs.example.com/flow/meta',
        usersMe: 'https://rs.example.com/users/me',
        usersMeCredentials: 'https://rs.example.com/users/me/update-credentials',
        usersMeMeta: 'https://rs.example.com/users/me/meta',
      },
    });

    const resolved: Record<string, unknown> = (await helper.resolveEndpointsExplicitly()) as Record<string, unknown>;

    // OIDC endpoints are resolved from the explicit config.
    expect(resolved['token_endpoint']).toBe('https://idp.example.com/oauth2/token');
    expect(resolved['authorization_endpoint']).toBe('https://idp.example.com/oauth2/authorize');
    RESOURCE_KEY_FORMS.forEach((key: string) => expect(resolved).not.toHaveProperty(key));
  });
});
