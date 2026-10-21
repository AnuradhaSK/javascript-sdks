// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {SessionData} from '@thunderid/browser';
import {ThunderIDContext, useThunderID} from '@thunderid/vue';
import {onBeforeUnmount, Ref, ref, shallowRef, ShallowRef, watch} from 'vue';
import {describeError} from './events';
import {decodeJwt, JwtClaims} from './jwt';

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

const load = async (sdk: ThunderIDContext): Promise<SessionSnapshot> => {
  if (!sdk.isSignedIn.value) return EMPTY;

  try {
    const [accessToken, idToken, idClaims] = await Promise.all([
      sdk.getAccessToken(),
      sdk.getIdToken(),
      sdk.getDecodedIdToken(),
    ]);
    const data: Partial<SessionData> = (await sdk.getStorageManager().getSessionData()) ?? {};
    const createdAt: number | null = typeof data.created_at === 'number' ? data.created_at : null;
    const expiresIn = Number(data.expires_in ?? 0);
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
      refreshToken: !!data.refresh_token,
      scope: typeof data.scope === 'string' ? data.scope : null,
    };
  } catch (error) {
    return {...EMPTY, error: describeError(error)};
  }
};

/**
 * Reads the current session through the SDK: tokens via getAccessToken()/getIdToken(), claims via
 * getDecodedIdToken(), and expiry from the stored session data. Reloads when the sign-in state or
 * `refreshKey` changes.
 */
export const useSession = (refreshKey: Ref<number>): Readonly<ShallowRef<SessionSnapshot>> => {
  const sdk: ThunderIDContext = useThunderID();
  const snapshot: ShallowRef<SessionSnapshot> = shallowRef<SessionSnapshot>(EMPTY);
  let latest = 0;

  watch(
    [sdk.isSignedIn, refreshKey],
    () => {
      latest += 1;
      const run: number = latest;

      void load(sdk).then((next: SessionSnapshot) => {
        if (run === latest) snapshot.value = next;
      });
    },
    {immediate: true},
  );

  return snapshot;
};

export const useNow = (intervalMs = 1000): Readonly<Ref<number>> => {
  const now: Ref<number> = ref<number>(Date.now());
  const timer: number = window.setInterval(() => {
    now.value = Date.now();
  }, intervalMs);

  onBeforeUnmount(() => window.clearInterval(timer));

  return now;
};
