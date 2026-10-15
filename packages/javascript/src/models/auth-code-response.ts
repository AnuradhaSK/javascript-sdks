// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Interface representing the authorization code response from the OAuth2/OIDC flow.
 */
export interface AuthCodeResponse {
  /**
   * The authorization code returned from the authorization endpoint
   */
  code: string;
  /**
   * The state parameter returned from the authorization endpoint
   */
  state: string;
}
