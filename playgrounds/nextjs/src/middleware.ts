// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {createRouteMatcher, thunderIDProxy} from '@thunderid/nextjs/server';
import {NextRequest, NextResponse} from 'next/server';

type RouteMatcher = (request: NextRequest) => boolean;

const DOCUMENTED_PATTERN = '/protected(.*)';
const isProtectedRoute: RouteMatcher = createRouteMatcher([DOCUMENTED_PATTERN, '/api/protected(.*)']);
const isProxyTrace: RouteMatcher = createRouteMatcher(['/api/proxy-trace']);

const matches = (matcher: RouteMatcher, pathname: string): boolean =>
  matcher({nextUrl: {pathname}} as unknown as NextRequest);

export default thunderIDProxy(async (thunderid, request: NextRequest) => {
  // Answered by the proxy itself, so the playground can show what thunderIDProxy() saw for this request.
  if (isProxyTrace(request)) {
    const session = await thunderid.getSession();

    return NextResponse.json(
      {
        handledBy: 'thunderIDProxy',
        isSignedIn: thunderid.isSignedIn(),
        session: session
          ? {
              exp: session.exp,
              hasRefreshToken: !!session.refreshToken,
              iat: session.iat,
              organizationId: session.organizationId ?? null,
              scopes: session.scopes,
              sub: session.sub,
            }
          : null,
        sessionId: thunderid.getSessionId() ?? null,
        routeMatcher: {
          pattern: DOCUMENTED_PATTERN,
          results: Object.fromEntries(
            ['/protected', '/protected/settings'].map((pathname: string) => [
              pathname,
              matches(isProtectedRoute, pathname),
            ]),
          ),
        },
      },
      {headers: {'cache-control': 'no-store'}},
    );
  }

  if (isProtectedRoute(request)) {
    return thunderid.protectRoute();
  }

  return undefined;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|thunderid-logo.svg).*)'],
};
