// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AuthClientConfig} from '@thunderid/javascript';
import {BrowserStorage} from './BrowserStorage';

/**
 * Browser-specific SDK configuration that extends the base OIDC config.
 */
export interface BrowserClientConfig {
  /**
   * Storage backend to use for session data.
   * @default BrowserStorage.SessionStorage
   */
  storage?: BrowserStorage | 'sessionStorage' | 'localStorage' | 'browserMemory';
  /** Allowed external URL prefixes for `httpRequest` calls. */
  allowedExternalUrls?: string[];
  /** Additional query params to append to every authorize request. */
  authParams?: Record<string, string>;
  /** Automatically refresh the access token before it expires. */
  periodicTokenRefresh?: boolean;
  /** Sign the user out when a token refresh attempt fails. @default false */
  autoLogoutOnTokenRefreshError?: boolean;
}

/** Full browser SDK configuration, combining base OIDC config with browser-specific fields. */
export type BrowserAuthConfig = AuthClientConfig<NonNullable<BrowserClientConfig['storage']>> &
  Omit<BrowserClientConfig, 'storage'>;
