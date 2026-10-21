// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useThunderID} from '@thunderid/react';
import {useEffect, useState} from 'react';
import {describeError} from './events';
import {decodeJwt, JwtClaims} from './jwt';
import {SdkStorageManager} from './sdk';

export interface SessionSnapshot {
  accessToken: string | null;
  error: string | null;
  expiresAt: number | null;
  idClaims: JwtClaims | null;
  idToken: string | null;
  issuedAt: number | null;
  refreshToken: boolean;
  scope: string | null;
}

const EMPTY: SessionSnapshot = {
  accessToken: null,
  error: null,
  expiresAt: null,
  idClaims: null,
  idToken: null,
  issuedAt: null,
  refreshToken: false,
  scope: null,
};

/**
 * Reads the current session through the SDK: tokens via getAccessToken()/getIdToken(), claims via
 * getDecodedIdToken(), and expiry from the stored session data.
 */
export const useSession = (refreshKey = 0): SessionSnapshot => {
  const {isSignedIn, getAccessToken, getIdToken, getDecodedIdToken, getStorageManager} = useThunderID();
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<SessionSnapshot> => {
      if (!isSignedIn) return EMPTY;

      try {
        const [accessToken, idToken, idClaims] = await Promise.all([
          getAccessToken(),
          getIdToken(),
          getDecodedIdToken(),
        ]);
        const storage: SdkStorageManager | null = (await getStorageManager()) as SdkStorageManager | null;
        const data: Record<string, unknown> = (await storage?.getSessionData()) ?? {};
        const createdAt: number | null = typeof data['created_at'] === 'number' ? data['created_at'] : null;
        const expiresIn = Number(data['expires_in'] ?? 0);
        const accessExp: unknown = decodeJwt(accessToken)?.payload['exp'];
        let expiresAt: number | null = null;

        if (createdAt && expiresIn) expiresAt = createdAt + expiresIn * 1000;
        else if (typeof accessExp === 'number') expiresAt = accessExp * 1000;

        return {
          accessToken,
          error: null,
          expiresAt,
          idClaims: idClaims as JwtClaims,
          idToken,
          issuedAt: createdAt,
          refreshToken: !!data['refresh_token'],
          scope: typeof data['scope'] === 'string' ? data['scope'] : null,
        };
      } catch (error) {
        return {...EMPTY, error: describeError(error)};
      }
    };

    void load().then((next: SessionSnapshot) => {
      if (!cancelled) setSnapshot(next);
    });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getAccessToken, getIdToken, getDecodedIdToken, getStorageManager, refreshKey]);

  return snapshot;
};

export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer: number = window.setInterval(() => setNow(Date.now()), intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
};
