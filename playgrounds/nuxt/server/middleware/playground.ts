// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getThunderIDContext, useServerSession} from '@thunderid/nuxt/server';
import type {ThunderIDEventContext, ThunderIDSessionPayload} from '@thunderid/nuxt/server';
import {createRouteMatcher} from '@thunderid/nuxt/utils';
import type {SsrSnapshot} from '../../lib/types';
import {traceStep} from '../lib/trace';

const isApiRoute: (path: string) => boolean = createRouteMatcher(['/api/**']);
const isAsset: (path: string) => boolean = createRouteMatcher(['/_nuxt/**', '/__nuxt*', '/favicon.svg', '/*.svg']);

/**
 * Server middleware of the playground. It runs after the ThunderID Nitro plugin has handled the
 * request, and:
 * - for API routes, starts the SDK trace the API explorer shows: the session cookie as
 *   `useServerSession()` sees it.
 * - for page requests, records what `getThunderIDContext()` holds, so the Server page can show the
 *   context the plugin built for its own server render.
 */
export default defineEventHandler(async (event) => {
  const path: string = getRequestURL(event).pathname;

  if (isApiRoute(path)) {
    traceStep(event, 'server middleware', `${event.method} ${path}`, 'info');

    const session: ThunderIDSessionPayload | null = await useServerSession(event);

    traceStep(
      event,
      'useServerSession()',
      session ? `session ${session.sessionId.slice(0, 8)}…, sub ${session.sub}` : 'no valid session cookie',
      session ? 'ok' : 'info',
    );

    return;
  }

  if (isAsset(path)) return;

  const context: ThunderIDEventContext | null = getThunderIDContext(event);
  const snapshot: SsrSnapshot = {
    capturedAt: Date.now(),
    flowMeta: !!(context as {flowMeta?: unknown} | null)?.flowMeta,
    isSignedIn: context?.isSignedIn ?? null,
    path,
    present: !!context,
    resolvedBaseUrl: context?.ssr?.resolvedBaseUrl ?? null,
    session: context?.session
      ? {
          accessTokenExpiresAt: context.session.accessTokenExpiresAt ?? null,
          exp: context.session.exp,
          scopes: context.session.scopes,
          sessionId: context.session.sessionId,
          sub: context.session.sub,
        }
      : null,
    userLoaded: !!context?.ssr?.user,
    userProfileLoaded: !!context?.ssr?.userProfile,
  };

  (event.context as Record<string, unknown>).playgroundSsr = snapshot;
});
