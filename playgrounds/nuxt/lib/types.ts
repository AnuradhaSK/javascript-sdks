// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Shapes shared by the playground's server routes and the pages that read them.
 */

/** What `getThunderIDContext(event)` held while the server rendered a page. */
export interface SsrSnapshot {
  capturedAt: number;
  flowMeta: boolean;
  isSignedIn: boolean | null;
  path: string;
  /** False when the ThunderID Nitro plugin did not populate the context (for example, no client ID). */
  present: boolean;
  resolvedBaseUrl: string | null;
  session: {
    accessTokenExpiresAt: number | null;
    exp: number;
    scopes: string;
    sessionId: string;
    sub: string;
  } | null;
  userLoaded: boolean;
  userProfileLoaded: boolean;
}

/** Response of `GET /api/playground/session`, built from `useServerSession()`. */
export interface PlaygroundSession {
  accessTokenClaims: Record<string, unknown> | null;
  accessTokenExpiresAt: number | null;
  hasIdToken: boolean;
  hasRefreshToken: boolean;
  idTokenClaims: Record<string, unknown> | null;
  organizationId: string | null;
  scopes: string | null;
  sessionExpiresAt: number | null;
  sessionId: string | null;
  signedIn: boolean;
  signedInAt: number | null;
  sub: string | null;
}

/** Response of `GET /api/playground/health`. */
export interface PlaygroundHealth {
  detail: string;
  state: 'up' | 'down';
  url: string;
}
