// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {useEffect, useState} from 'react';
import {describeError} from './events';
import type {ServerSession} from './serverSession';
import {readServerSession} from '../app/actions';

export interface SessionSnapshot {
  loading: boolean;
  session: ServerSession | null;
  error: string | null;
}

/**
 * Loads the server-held session through the `readServerSession` server action, which calls
 * `thunderid().getSessionId()` and `getAccessToken()`. Reloads when `refreshKey` or `isSignedIn`
 * changes.
 */
export const useServerSession = (isSignedIn: boolean, refreshKey = 0): SessionSnapshot => {
  const key = `${String(isSignedIn)}:${refreshKey}`;
  const [loaded, setLoaded] = useState<{error: string | null; key: string | null; session: ServerSession | null}>({
    error: null,
    key: null,
    session: null,
  });

  useEffect(() => {
    let cancelled = false;

    readServerSession()
      .then((session: ServerSession) => {
        if (!cancelled) setLoaded({error: session.error, key, session});
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoaded({error: describeError(error), key, session: null});
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return {error: loaded.error, loading: loaded.key !== key, session: loaded.session};
};

export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer: number = window.setInterval(() => setNow(Date.now()), intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
};
