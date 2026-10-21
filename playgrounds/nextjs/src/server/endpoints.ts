// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export interface Endpoint {
  body?: string;
  contentType?: string;
  file: string;
  id: string;
  method: 'GET' | 'POST';
  path: string;
  /** True when the request passes through thunderIDProxy() before the handler. */
  proxied: boolean;
  protectedRoute?: boolean;
  source: string;
  summary: string;
  tags: string[];
}

const PROXY_SOURCE = `import {createRouteMatcher, thunderIDProxy} from '@thunderid/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/protected(.*)', '/api/protected(.*)']);
const isProxyTrace = createRouteMatcher(['/api/proxy-trace']);

export default thunderIDProxy(async (thunderid, request) => {
  if (isProxyTrace(request)) {
    const session = await thunderid.getSession();

    return NextResponse.json({
      handledBy: 'thunderIDProxy',
      isSignedIn: thunderid.isSignedIn(),
      sessionId: thunderid.getSessionId() ?? null,
      session: session && {sub: session.sub, exp: session.exp, scopes: session.scopes, ...},
    });
  }

  if (isProtectedRoute(request)) {
    return thunderid.protectRoute();
  }
});`;

export const ENDPOINTS: Endpoint[] = [
  {
    file: 'src/middleware.ts',
    id: 'proxy-trace',
    method: 'GET',
    path: '/api/proxy-trace',
    proxied: true,
    source: PROXY_SOURCE,
    summary:
      'Answered by the proxy itself: what thunderIDProxy() resolved for this request (verified session, refreshed if it was about to expire).',
    tags: ['thunderIDProxy()', 'getSession()'],
  },
  {
    file: 'src/app/api/session/route.ts',
    id: 'session',
    method: 'GET',
    path: '/api/session',
    proxied: true,
    source: `import {thunderid} from '@thunderid/nextjs/server';

export const GET = async () => {
  const sdk = await thunderid();
  const sessionId = await sdk.getSessionId();

  if (!sessionId) return NextResponse.json({signedIn: false});

  const accessToken = await sdk.getAccessToken(sessionId);

  return NextResponse.json({signedIn: true, sessionId, claims: decode(accessToken)});
};`,
    summary: 'A route handler that reads the session with thunderid(). The access token is masked in the response.',
    tags: ['route handler', 'thunderid()'],
  },
  {
    file: 'src/app/api/protected/profile/route.ts',
    id: 'protected-api',
    method: 'GET',
    path: '/api/protected/profile',
    protectedRoute: true,
    proxied: true,
    source: `// src/middleware.ts: isProtectedRoute matches /api/protected/*, so
// thunderid.protectRoute() redirects anonymous requests before this runs.

export const GET = async () => {
  const sdk = await thunderid();
  const accessToken = await sdk.getAccessToken((await sdk.getSessionId())!);
  const {sub, scope, username} = decode(accessToken);

  return NextResponse.json({sub, scope, username});
};`,
    summary:
      'A protected route handler. Send it anonymously to see protectRoute() redirect to NEXT_PUBLIC_THUNDERID_SIGN_IN_URL, or, when that is not set, back to the same-origin referring page (or /).',
    tags: ['protectRoute()', 'route handler'],
  },
  {
    file: 'src/app/protected/page.tsx',
    id: 'protected-page',
    method: 'GET',
    path: '/protected',
    protectedRoute: true,
    proxied: true,
    source: `// A Server Component behind protectRoute(). Anonymous visitors never reach this render.
const ProtectedPage = async () => {
  const session = await loadServerSession(); // thunderid().getSessionId() + getAccessToken()

  return <main>Rendered for {session.claims?.sub}</main>;
};`,
    summary: 'A protected page. The response body is the rendered HTML, or the page it was redirected to.',
    tags: ['protectRoute()', 'Server Component'],
  },
  {
    body: 'logout_token=',
    contentType: 'application/x-www-form-urlencoded',
    file: 'src/app/api/auth/backchannel-logout/route.ts',
    id: 'backchannel',
    method: 'POST',
    path: '/api/auth/backchannel-logout',
    proxied: true,
    source: `import {backchannelLogout} from '@thunderid/nextjs/server';

// ThunderID posts a signed logout_token here when a session ends. The handler answers 200 for a
// valid token, 400 for a missing or invalid one, and 500 when it could not record the logout.
export const {POST} = backchannelLogout();`,
    summary:
      'The OpenID Connect back-channel logout endpoint. Without a valid logout_token signed by ThunderID it answers 400.',
    tags: ['backchannelLogout()'],
  },
];
