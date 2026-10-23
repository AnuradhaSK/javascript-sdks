// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {AuthorizationDetail} from './oauth-request';

/**
 * Options for initiating a CIBA backchannel authentication request (CIBA Core 1.0 §7.1).
 * Exactly one of loginHint, loginHintToken, or idTokenHint must be provided.
 */
export interface CIBAInitiateOptions {
  /**
   * A hint about the end-user to authenticate, typically an email address, phone number,
   * or username. Sent as the login_hint parameter.
   */
  loginHint?: string;

  /**
   * An opaque token carrying hint data about the end-user, issued by a claims provider.
   * Sent as the login_hint_token parameter.
   */
  loginHintToken?: string;

  /**
   * A previously issued ID Token that identifies the end-user.
   * Sent as the id_token_hint parameter.
   */
  idTokenHint?: string;

  /**
   * A short human-readable string displayed on both the consumption device and the
   * authentication device to bind the two interactions and help the user correlate them.
   */
  bindingMessage?: string;

  /**
   * Requested expiry in seconds for the auth_req_id. The authorization server may
   * honour a shorter lifetime than requested.
   */
  requestedExpiry?: number;

  /**
   * Space-separated Authentication Context Class Reference values indicating the
   * authentication context the authorization server is requested to use.
   */
  acrValues?: string;

  /**
   * RFC 9396 authorization details to request, sent JSON-encoded as the authorization_details
   * parameter. Takes precedence over the authorizationDetails configuration.
   */
  authorizationDetails?: AuthorizationDetail[];
}

/**
 * Response returned by the backchannel authentication endpoint on a successful
 * CIBA initiation (CIBA Core 1.0 §7.3).
 */
export interface CIBAInitiateResponse {
  /**
   * Unique identifier for the authentication request. Must be passed to pollCIBA()
   * as the auth_req_id token endpoint parameter.
   */
  authReqId: string;

  /**
   * Minimum number of seconds the client must wait between polling attempts.
   * Increases by 5 seconds on each slow_down error per CIBA Core 1.0 §7.3.
   */
  interval: number;

  /**
   * Lifetime in seconds of the auth_req_id. Polling must stop once this duration
   * has elapsed without approval.
   */
  expiresIn: number;
}

/**
 * Terminal and transient error codes returned by the token endpoint during
 * CIBA polling (CIBA Core 1.0 §11).
 *
 * - `authorization_pending` — The user has not yet approved or denied the request.
 * - `slow_down` — The client is polling too fast; increase the interval by 5 seconds.
 * - `expired_token` — The auth_req_id has expired without user action.
 * - `access_denied` — The user denied the authentication request.
 */
export type CIBAErrorCode = 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied';

/**
 * Optional settings for pollCIBA().
 */
export interface CIBAPollOptions {
  /**
   * An AbortSignal that can be used to cancel polling. If the signal is aborted
   * during a sleep window the wait is interrupted immediately and pollCIBA()
   * rejects with a JS-AUTH_CORE-CIBA2-AB05 error.
   */
  signal?: AbortSignal;
}
