// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import config from './config.ts';

export interface RouteParam {
  name: string;
  required: boolean;
  type: string;
  value: string;
  where: 'path' | 'query';
}

export interface RouteSpec {
  /** Example request body, sent with `contentType`. */
  body?: string;
  /** Labels for the route's handlers, in mount order, as they appear in the SDK trace. */
  chain: string[];
  contentType?: string;
  description: string;
  group: 'Authentication' | 'Session' | 'Tokens' | 'Protected routes';
  id: string;
  /** Whether the route needs a session. */
  locked: boolean;
  method: 'GET' | 'POST';
  params: RouteParam[];
  path: string;
  /** `#region` names in `src/server.ts` that make up the route's source. */
  regions: string[];
  summary: string;
}

const routes: RouteSpec[] = [
  {
    chain: ['handleSignIn()'],
    description:
      'Without a code, creates the session cookie and redirects to the ThunderID authorize endpoint. With a code (the redirect back from ThunderID), exchanges it for tokens and calls onSignIn.',
    group: 'Authentication',
    id: 'login',
    locked: false,
    method: 'GET',
    params: [
      {name: 'code', required: false, type: 'string', value: '', where: 'query'},
      {name: 'state', required: false, type: 'string', value: '', where: 'query'},
    ],
    path: '/login',
    regions: ['setup', 'login'],
    summary: 'Start or finish sign-in.',
  },
  {
    chain: ['handleSignOut()'],
    description:
      'Ends the local session, clears the cookie and redirects to the ThunderID end-session endpoint. Sending this as your session signs you out of the playground.',
    group: 'Authentication',
    id: 'logout',
    locked: true,
    method: 'GET',
    params: [],
    path: '/logout',
    regions: ['logout'],
    summary: 'Sign out.',
  },
  {
    body: JSON.stringify({applicationId: config.applicationId ?? '<application id>', flowType: 'SIGN_IN'}, null, 2),
    chain: ['handleFlow()'],
    contentType: 'application/json',
    description:
      'Drives the embedded (app-native) sign-in flow one step at a time. The first call starts the flow; later calls send executionId, challengeToken, authId and inputs.',
    group: 'Authentication',
    id: 'flow',
    locked: false,
    method: 'POST',
    params: [],
    path: '/flow/sign-in',
    regions: ['flow'],
    summary: 'Embedded sign-in flow.',
  },
  {
    body: 'logout_token=not-a-real-token',
    chain: ['handleBackchannelLogout()'],
    contentType: 'application/x-www-form-urlencoded',
    description:
      'ThunderID posts a signed logout_token here when a session ends elsewhere. The handler verifies it and ends the matching local sessions. An invalid token gets 400.',
    group: 'Authentication',
    id: 'backchannel',
    locked: false,
    method: 'POST',
    params: [],
    path: '/backchannel-logout',
    regions: ['backchannel'],
    summary: 'OpenID Connect back-channel logout.',
  },
  {
    chain: ['handler'],
    description: 'Reports whether the request carries a session cookie and whether the SDK considers it signed in.',
    group: 'Session',
    id: 'session',
    locked: false,
    method: 'GET',
    params: [],
    path: '/api/session',
    regions: ['session'],
    summary: 'Session status.',
  },
  {
    chain: ['protect()', 'handler'],
    description: 'Returns the signed-in user from the session with client.getUser().',
    group: 'Session',
    id: 'me',
    locked: true,
    method: 'GET',
    params: [],
    path: '/api/me',
    regions: ['unauthenticated', 'me'],
    summary: 'Current user.',
  },
  {
    chain: ['protect()', 'handler'],
    description: 'Returns the claims of the session ID token with client.getDecodedIdToken().',
    group: 'Session',
    id: 'idToken',
    locked: true,
    method: 'GET',
    params: [],
    path: '/api/id-token',
    regions: ['unauthenticated', 'idToken'],
    summary: 'Decoded ID token.',
  },
  {
    body: '{}',
    chain: ['handler'],
    contentType: 'application/json',
    description:
      'Uses the refresh token in the session to get a new access token with client.refreshAccessToken(). Needs a refresh token, so the application must allow the refresh_token grant.',
    group: 'Tokens',
    id: 'refresh',
    locked: true,
    method: 'POST',
    params: [],
    path: '/api/token/refresh',
    regions: ['unauthenticated', 'refresh'],
    summary: 'Refresh tokens.',
  },
  {
    chain: ['handler'],
    description: 'Open to everyone. A baseline that runs no SDK checks.',
    group: 'Protected routes',
    id: 'public',
    locked: false,
    method: 'GET',
    params: [],
    path: '/api/public',
    regions: ['public'],
    summary: 'Example public route.',
  },
  {
    chain: ['protect()', 'handler'],
    description: 'Any signed-in user. protect() answers 401 when the session cookie is missing or not signed in.',
    group: 'Protected routes',
    id: 'orders',
    locked: true,
    method: 'GET',
    params: [],
    path: '/api/orders',
    regions: ['unauthenticated', 'orders'],
    summary: 'Example protected route.',
  },
  {
    chain: ['protect()', 'handler'],
    description: 'A protected route with a path parameter.',
    group: 'Protected routes',
    id: 'order',
    locked: true,
    method: 'GET',
    params: [{name: 'id', required: true, type: 'string', value: 'ord_1001', where: 'path'}],
    path: '/api/orders/:id',
    regions: ['order'],
    summary: 'Example protected route with a parameter.',
  },
  {
    chain: ['protect()', `requireScope('${config.adminScope}')`, 'handler'],
    description: `Requires the ${config.adminScope} scope in the access token, then lists users through the ThunderID management API with client.getUsers().`,
    group: 'Protected routes',
    id: 'admin',
    locked: true,
    method: 'GET',
    params: [{name: 'limit', required: false, type: 'number', value: '10', where: 'query'}],
    path: '/api/admin/users',
    regions: ['requireScope', 'admin'],
    summary: 'Example scoped route.',
  },
];

const catalog: {chains: () => Map<string, string[]>; routes: RouteSpec[]} = {
  chains: (): Map<string, string[]> =>
    new Map(routes.map((route: RouteSpec): [string, string[]] => [`${route.method} ${route.path}`, route.chain])),
  routes,
};

export default catalog;
