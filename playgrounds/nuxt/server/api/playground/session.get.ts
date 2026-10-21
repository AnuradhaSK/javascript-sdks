// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useServerSession} from '@thunderid/nuxt/server';
import type {ThunderIDSessionPayload} from '@thunderid/nuxt/server';
import type {PlaygroundSession} from '../../../lib/types';
import {decodeClaims} from '../../lib/claims';
import {traced, traceStep} from '../../lib/trace';

/**
 * GET /api/playground/session
 *
 * Reads the session cookie with `useServerSession()` and describes it: expiry, scopes, and the
 * decoded token claims. Raw tokens stay on the server.
 */
export default defineEventHandler(async (event): Promise<PlaygroundSession> => {
  const session: ThunderIDSessionPayload | null = await traced(
    event,
    'handler: useServerSession(event)',
    () => useServerSession(event),
    (value: ThunderIDSessionPayload | null) => (value ? `sub ${value.sub}` : 'null'),
  );

  if (!session) {
    traceStep(event, 'response', 'signedIn: false', 'info');

    return {
      accessTokenClaims: null,
      accessTokenExpiresAt: null,
      hasIdToken: false,
      hasRefreshToken: false,
      idTokenClaims: null,
      organizationId: null,
      scopes: null,
      sessionExpiresAt: null,
      sessionId: null,
      signedIn: false,
      signedInAt: null,
      sub: null,
    };
  }

  traceStep(event, 'decode tokens', 'access and ID token claims, without verification', 'ok');

  return {
    accessTokenClaims: decodeClaims(session.accessToken),
    accessTokenExpiresAt: session.accessTokenExpiresAt ?? null,
    hasIdToken: !!session.idToken,
    hasRefreshToken: !!session.refreshToken,
    idTokenClaims: decodeClaims(session.idToken),
    organizationId: session.organizationId ?? null,
    scopes: session.scopes,
    sessionExpiresAt: session.exp,
    sessionId: session.sessionId,
    signedIn: true,
    signedInAt: session.signedInAt ?? session.iat,
    sub: session.sub,
  };
});
