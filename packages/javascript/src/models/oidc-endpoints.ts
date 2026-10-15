// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * @deprecated Use the properties defined in the new `OIDCEndpoints` at the `/models/oidc-endpoints.ts` instead.
 * FIXME: Remove this once the final refactoring is done.
 */
export interface LegacyOIDCEndpoints {
  authorizationEndpoint: string;
  endSessionEndpoint: string;
  introspectionEndpoint?: string;
  jwksUri: string;
  registrationEndpoint?: string;
  revocationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  wellKnown?: string;
}

/**
 * Interface representing OpenID Connect endpoints configuration.
 * FIXME: Remove the temporary extends of legacy OIDC endpoints.
 */
export interface OIDCEndpoints extends Partial<LegacyOIDCEndpoints> {
  /**
   * The authorization endpoint URL where the authentication request is sent
   */
  authorization: string;

  /**
   * The OpenID Provider's discovery endpoint URL
   */
  discovery: string;

  /**
   * The end session endpoint URL used to terminate the user's session
   */
  endSession: string;

  /**
   * The introspection endpoint URL used to validate tokens
   */
  introspection: string;

  /**
   * The issuer identifier URL for the OpenID Provider
   */
  issuer: string;

  /**
   * The JSON Web Key Set endpoint URL that provides the public keys to verify tokens
   */
  jwks: string;

  /**
   * The revocation endpoint URL used to revoke access or refresh tokens
   */
  revocation: string;

  /**
   * The userinfo endpoint URL that returns claims about the authenticated user
   */
  userinfo: string;
}
