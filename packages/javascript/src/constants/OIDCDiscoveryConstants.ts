// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Constants related to OpenID Connect (OIDC) metadata and endpoints.
 * This object contains all the standard OIDC endpoints and storage keys
 * used throughout the application for authentication and authorization.
 *
 * @remarks
 * The constants are organized into two main sections:
 * 1. Endpoints - Contains all OIDC standard endpoint paths
 * 2. Storage - Contains keys used for storing OIDC-related data
 *
 * @example
 * ```typescript
 * // Using an endpoint
 * const authEndpoint = OIDCDiscoveryConstants.Endpoints.AUTHORIZATION;
 *
 * // Using a storage key
 * const tokenKey = OIDCDiscoveryConstants.Storage.StorageKeys.Endpoints.TOKEN;
 * ```
 */
const OIDCDiscoveryConstants: {
  readonly Endpoints: {
    readonly AUTHORIZATION: string;
    readonly END_SESSION: string;
    readonly ISSUER: string;
    readonly JWKS: string;
    readonly REVOCATION: string;
    readonly TOKEN: string;
    readonly USERINFO: string;
  };
  readonly Storage: {
    readonly StorageKeys: {
      readonly Endpoints: {
        readonly AUTHORIZATION: string;
        readonly END_SESSION: string;
        readonly ISSUER: string;
        readonly JWKS: string;
        readonly REVOCATION: string;
        readonly TOKEN: string;
        readonly USERINFO: string;
      };
      readonly OPENID_PROVIDER_CONFIG_INITIATED: string;
    };
  };
} = {
  /**
   * Collection of standard OIDC endpoint paths used for authentication flows.
   * These endpoints are relative paths that should be appended to the base URL
   * of your identity provider.
   */

  Endpoints: {
    /**
     * Authorization endpoint for initiating the OAuth2/OIDC flow.
     * This endpoint is used to request authorization and receive an authorization code.
     */
    AUTHORIZATION: '/oauth2/authorize',

    /**
     * End session endpoint for logout functionality.
     * Used to terminate the user's session and perform logout operations.
     */
    END_SESSION: '/oauth2/logout',

    /**
     * Token issuer endpoint.
     * The endpoint that issues OAuth2/OIDC tokens.
     */
    ISSUER: '/oauth2/token',

    /**
     * JSON Web Key Set endpoint for key validation.
     * Provides the public keys used to verify token signatures.
     */
    JWKS: '/oauth2/jwks',

    /**
     * Token revocation endpoint.
     * Used to invalidate access or refresh tokens before they expire.
     */
    REVOCATION: '/oauth2/revoke',

    /**
     * Token endpoint for obtaining access tokens.
     * Used to exchange authorization codes for access tokens and refresh tokens.
     */
    TOKEN: '/oauth2/token',

    /**
     * UserInfo endpoint for obtaining user claims.
     * Provides authenticated user information when called with a valid access token.
     */
    USERINFO: '/oauth2/userinfo',
  },

  /**
   * Storage related constants used for maintaining OIDC state.
   * These constants define the keys used to store OIDC-related data
   * in the browser's storage mechanisms.
   */

  Storage: {
    /**
     * Storage keys for various OIDC endpoints and configurations.
     * These keys are used to store endpoint URLs and configuration
     * states in the browser's storage.
     */

    StorageKeys: {
      /**
       * Collection of storage keys for OIDC endpoints.
       * These keys are used to store the discovered endpoint URLs
       * from the OpenID Provider's configuration.
       */

      Endpoints: {
        /**
         * Storage key for the authorization endpoint URL.
         * Used to store the URL where authorization requests should be sent.
         */
        AUTHORIZATION: 'authorization_endpoint',

        /**
         * Storage key for the end session endpoint URL.
         * Used to store the URL where logout requests should be sent.
         */
        END_SESSION: 'end_session_endpoint',

        /**
         * Storage key for the issuer identifier URL.
         * Used to store the URL that identifies the OpenID Provider.
         */
        ISSUER: 'issuer',

        /**
         * Storage key for the JWKS URI endpoint URL.
         * Used to store the URL where JSON Web Key Sets can be retrieved.
         */
        JWKS: 'jwks_uri',

        /**
         * Storage key for the revocation endpoint URL.
         * Used to store the URL where token revocation requests should be sent.
         */
        REVOCATION: 'revocation_endpoint',

        /**
         * Storage key for the token endpoint URL.
         * Used to store the URL where token requests should be sent.
         */
        TOKEN: 'token_endpoint',

        /**
         * Storage key for the userinfo endpoint URL.
         * Used to store the URL where user information can be retrieved.
         */
        USERINFO: 'userinfo_endpoint',
      },

      /**
       * Flag to track if OpenID Provider configuration is initiated.
       * Used to determine if the OIDC discovery process has been started.
       * This helps prevent duplicate initialization attempts.
       */
      OPENID_PROVIDER_CONFIG_INITIATED: 'op_config_initiated',
    },
  },
} as const;

export default OIDCDiscoveryConstants;
