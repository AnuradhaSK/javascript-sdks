// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {client, sdkState} from './client';
import {describeError} from './events';
import {decodeJwt, JwtClaims} from './jwt';

export interface SessionSnapshot {
  accessToken: string | null;
  error: string | null;
  expiresAt: number | null;
  idClaims: JwtClaims | null;
  idToken: string | null;
  issuedAt: number | null;
  scope: string | null;
}

export const EMPTY_SESSION: SessionSnapshot = {
  accessToken: null,
  error: null,
  expiresAt: null,
  idClaims: null,
  idToken: null,
  issuedAt: null,
  scope: null,
};

/**
 * Reads the current session through the client: tokens via getAccessToken()/getIdToken() and claims
 * via getDecodedIdToken(). ThunderIDBrowserClient keeps the stored session data (expires_in,
 * created_at, refresh_token) behind the protected getStorageManager(), so expiry comes from the
 * access token's own `exp` and `iat` claims and is unknown for opaque tokens.
 */
export const loadSession = async (): Promise<SessionSnapshot> => {
  if (!sdkState.get().signedIn) return EMPTY_SESSION;

  try {
    const [accessToken, idToken, idClaims] = await Promise.all([
      client.getAccessToken(),
      client.getIdToken(),
      client.getDecodedIdToken(),
    ]);
    const access: JwtClaims | null = decodeJwt(accessToken)?.payload ?? null;
    const exp: unknown = access?.['exp'];
    const iat: unknown = access?.['iat'];
    const scope: unknown = access?.['scope'];

    return {
      accessToken,
      error: null,
      expiresAt: typeof exp === 'number' ? exp * 1000 : null,
      idClaims: idClaims as JwtClaims,
      idToken,
      issuedAt: typeof iat === 'number' ? iat * 1000 : null,
      scope: typeof scope === 'string' ? scope : null,
    };
  } catch (error) {
    return {...EMPTY_SESSION, error: describeError(error)};
  }
};
