// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// A plain node:http server: the sign-in and sign-out routes an app built on @thunderid/node needs,
// and the operations explorer. The explorer shows the `#region` blocks of this file next to the
// operations they use.

import {readdirSync, readFileSync} from 'node:fs';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import {CookieConfig, generateSessionId, getSessionCookieOptions, type SessionCookieConfig} from '@thunderid/node';
import {client, serviceClient} from './client.ts';
import config from './config.ts';
import explorer, {type RunRequest} from './explorer.ts';
import {traceClient, traceFetch, traceSdkLogs} from './trace.ts';

traceSdkLogs();
traceFetch();
traceClient(client, 'client');
traceClient(serviceClient, 'serviceClient');

const COOKIE_NAME: string = CookieConfig.getSessionCookieName();
const cookieOptions: Omit<SessionCookieConfig, 'expiryTime'> = getSessionCookieOptions({
  secure: config.appUrl.startsWith('https:'),
});

const PUBLIC_DIR: URL = new URL('../public/', import.meta.url);
const PUBLIC_FILES: Set<string> = new Set<string>(readdirSync(PUBLIC_DIR));
const CONTENT_TYPES: Record<string, string> = {
  css: 'text/css; charset=utf-8',
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  svg: 'image/svg+xml',
};

const readSessionId = (req: IncomingMessage): string | undefined =>
  req.headers.cookie
    ?.split(';')
    .map((part: string): string[] => part.trim().split('='))
    .find(([name]: string[]): boolean => name === COOKIE_NAME)?.[1];

const sessionCookie = (value: string, maxAge?: number): string =>
  [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    `SameSite=${cookieOptions.sameSite ?? 'lax'}`,
    cookieOptions.httpOnly ? 'HttpOnly' : '',
    cookieOptions.secure ? 'Secure' : '',
    maxAge === undefined ? '' : `Max-Age=${maxAge}`,
  ]
    .filter(Boolean)
    .join('; ');

const redirect = (res: ServerResponse, location: string, cookie?: string): void => {
  res.writeHead(302, {Location: location, ...(cookie ? {'Set-Cookie': cookie} : {})}).end();
};

const sendJson = (res: ServerResponse, status: number, body: unknown, cookie?: string): void => {
  res
    .writeHead(status, {'Content-Type': 'application/json', ...(cookie ? {'Set-Cookie': cookie} : {})})
    .end(JSON.stringify(body));
};

const readBody = async (req: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
};

const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// #region login
// GET /login: without a code, start sign-in for the browser session; with one (the redirect back
// from ThunderID, the afterSignInUrl), finish it.
const login = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const sessionId: string = readSessionId(req) ?? generateSessionId();
  const code: string | null = url.searchParams.get('code');
  const state: string | null = url.searchParams.get('state');

  if (!code || !state) {
    await client.signIn((authorizeUrl: string) => redirect(res, authorizeUrl, sessionCookie(sessionId)), sessionId);
    if (!res.headersSent) redirect(res, '/'); // Already signed in.
    return;
  }

  await client.signIn(undefined, sessionId, code, state);
  redirect(res, '/');
};
// #endregion

// #region logout
// GET /logout: redirect to the ThunderID end-session endpoint, which comes back here (the
// afterSignOutUrl) with state=sign_out_success.
const logout = async (req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> => {
  const sessionId: string | undefined = readSessionId(req);

  if (url.searchParams.get('state') === 'sign_out_success' || !sessionId) {
    redirect(res, '/');
    return;
  }

  const signOutUrl: string = await client.signOut(sessionId);
  redirect(res, signOutUrl, sessionCookie(generateSessionId()));
};
// #endregion

const ops: ReturnType<typeof explorer> = explorer();

const serveStatic = (res: ServerResponse, name: string): void => {
  if (!PUBLIC_FILES.has(name)) {
    sendJson(res, 404, {error: 'not_found'});
    return;
  }
  res
    .writeHead(200, {'Content-Type': CONTENT_TYPES[name.split('.').pop() ?? ''] ?? 'application/octet-stream'})
    .end(readFileSync(new URL(name, PUBLIC_DIR)));
};

const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const url: URL = new URL(req.url ?? '/', config.appUrl);

  if (req.method === 'GET' && url.pathname === '/login') {
    await login(req, res, url);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/logout') {
    await logout(req, res, url);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/_playground/meta') {
    // Every browser gets a session id up front, so operations can run as it before sign-in.
    const existing: string | undefined = readSessionId(req);
    const sessionId: string = existing ?? generateSessionId();
    sendJson(res, 200, await ops.meta(sessionId), existing ? undefined : sessionCookie(sessionId));
    return;
  }
  if (req.method === 'POST' && url.pathname === '/_playground/run') {
    let request: RunRequest;
    try {
      request = JSON.parse((await readBody(req)) || '{}') as RunRequest;
    } catch {
      sendJson(res, 400, {message: 'The request body is not valid JSON.'});
      return;
    }
    const {body, status} = await ops.run(request, readSessionId(req));
    sendJson(res, status, body);
    return;
  }
  if (req.method === 'GET') {
    serveStatic(res, url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
    return;
  }
  sendJson(res, 405, {error: 'method_not_allowed'});
};

createServer((req: IncomingMessage, res: ServerResponse): void => {
  handle(req, res).catch((e: unknown): void => {
    process.stderr.write(`${errorMessage(e)}\n`);
    if (!res.headersSent) {
      sendJson(res, 500, {error: (e as {code?: string}).code ?? 'error', message: errorMessage(e)});
    }
  });
}).listen(config.port, () => {
  process.stdout.write(`ThunderID Node.js playground on ${config.appUrl} (ThunderID at ${config.baseUrl})\n`);
});
