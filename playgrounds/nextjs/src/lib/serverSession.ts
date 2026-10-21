// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {thunderid} from '@thunderid/nextjs/server';
import {decodeJwt, JwtClaims} from './jwt';

export type TraceKind = 'ok' | 'error' | 'info';

export interface TraceStep {
  detail: string;
  durationMs: number;
  kind: TraceKind;
  name: string;
}

/**
 * The session as server code sees it through the public `thunderid()` API. The access token comes
 * from the HttpOnly session cookie; `@thunderid/nextjs` keeps no ID token on the server.
 */
export interface ServerSession {
  accessToken: string | null;
  claims: JwtClaims | null;
  error: string | null;
  renderedAt: number;
  sessionId: string | null;
  signedIn: boolean;
  trace: TraceStep[];
}

const describe = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Reads the current session with `thunderid()`, timing each SDK call so the playground can show a
 * trace of what server code did.
 */
export const loadServerSession = async (): Promise<ServerSession> => {
  const trace: TraceStep[] = [];
  const result: ServerSession = {
    accessToken: null,
    claims: null,
    error: null,
    renderedAt: Date.now(),
    sessionId: null,
    signedIn: false,
    trace,
  };

  const step = async <T>(name: string, call: () => Promise<T>, detail: (value: T) => string): Promise<T> => {
    const started: number = performance.now();

    try {
      const value: T = await call();

      trace.push({detail: detail(value), durationMs: performance.now() - started, kind: 'ok', name});

      return value;
    } catch (error) {
      trace.push({detail: describe(error), durationMs: performance.now() - started, kind: 'error', name});
      throw error;
    }
  };

  try {
    const sdk: Awaited<ReturnType<typeof thunderid>> = await step(
      'thunderid()',
      () => thunderid(),
      () => 'server helpers ready',
    );
    const sessionId: string | undefined = await step(
      'getSessionId()',
      () => sdk.getSessionId(),
      (value: string | undefined) => (value ? `session ${value}` : 'no verified session cookie'),
    );

    if (!sessionId) return result;

    result.sessionId = sessionId;

    const accessToken: string = await step(
      'getAccessToken(sessionId)',
      () => sdk.getAccessToken(sessionId),
      (value: string) => `${value.length} chars, read from the session cookie`,
    );

    result.accessToken = accessToken;
    result.claims = decodeJwt(accessToken)?.payload ?? null;
    result.signedIn = true;
    trace.push({
      detail: result.claims ? `${Object.keys(result.claims).length} claims` : 'opaque token, nothing to decode',
      durationMs: 0,
      kind: 'info',
      name: 'decode access token',
    });
  } catch (error) {
    result.error = describe(error);
  }

  return result;
};

export const maskToken = (token: string | null): string | null =>
  token ? `${token.slice(0, 12)}${'•'.repeat(12)}${token.slice(-6)}` : null;
