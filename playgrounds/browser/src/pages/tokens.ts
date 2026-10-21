// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {sdkState} from '../lib/client';
import {h, mount} from '../lib/dom';
import {decodeJwt, DecodedJwt, formatClaim, formatDuration, JwtClaims} from '../lib/jwt';
import {EMPTY_SESSION, loadSession, SessionSnapshot} from '../lib/session';
import {Scope} from '../lib/store';

const CLAIM_NOTES: Record<string, string> = {
  acr: 'authentication context class',
  amr: 'authentication methods used',
  aud: 'audience',
  auth_time: 'time the user authenticated',
  azp: 'authorized party',
  client_id: 'client the token was issued to',
  email: 'email address',
  exp: 'expires at',
  iat: 'issued at',
  iss: 'issuer',
  jti: 'token id',
  nbf: 'not valid before',
  nonce: 'replay protection value',
  scope: 'granted scopes',
  sid: 'session id',
  sub: 'subject (user id)',
};

const TIME_CLAIMS: string[] = ['exp', 'iat', 'nbf', 'auth_time'];

const claimsTable = (claims: JwtClaims, now: number): HTMLElement =>
  h(
    'table',
    {className: 'pg-claims'},
    h(
      'tbody',
      {},
      Object.entries(claims).map(([key, value]: [string, unknown]) => {
        const isTime: boolean = TIME_CLAIMS.includes(key) && typeof value === 'number';
        const at: number = isTime ? (value as number) * 1000 : 0;
        let note: string | undefined = CLAIM_NOTES[key];

        if (isTime) {
          note = `${new Date(at).toLocaleString()} · ${
            at > now ? `in ${formatDuration(at - now)}` : `${formatDuration(now - at)} ago`
          }`;
        }

        return h('tr', {}, h('th', {scope: 'row'}, key), h('td', {}, formatClaim(value), note && h('small', {}, note)));
      }),
    ),
  );

const tokenCard = (label: string, source: string, token: string | null, decoded: DecodedJwt | null): HTMLElement => {
  let revealed = false;
  const value: HTMLElement = h('div', {className: 'pg-token'});
  const revealButton: HTMLButtonElement = h(
    'button',
    {className: 'pg-btn', 'data-size': 'sm', disabled: !token, type: 'button'},
    'Reveal',
  );
  const copyButton: HTMLButtonElement = h(
    'button',
    {className: 'pg-btn', 'data-size': 'sm', disabled: !token, type: 'button'},
    'Copy',
  );

  const renderValue = (): void => {
    value.dataset['masked'] = String(!revealed);
    revealButton.textContent = revealed ? 'Hide' : 'Reveal';

    if (!token) value.textContent = 'No token';
    else value.textContent = revealed ? token : `${token.slice(0, 12)}${'•'.repeat(24)}${token.slice(-6)}`;
  };

  revealButton.addEventListener('click', () => {
    revealed = !revealed;
    renderValue();
  });
  copyButton.addEventListener('click', () => {
    if (!token) return;

    navigator.clipboard.writeText(token).then(
      () => {
        copyButton.textContent = 'Copied';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 1500);
      },
      () => undefined,
    );
  });
  renderValue();

  const now: number = Date.now();

  return h(
    'section',
    {'aria-label': label, className: 'pg-card'},
    h(
      'div',
      {className: 'pg-card-head'},
      h('div', {}, h('h2', {}, label), h('div', {className: 'pg-hook-sig'}, source)),
      h('div', {className: 'pg-row'}, revealButton, copyButton),
    ),
    h('div', {className: 'pg-card-body'}, value),
    token && !decoded && h('p', {className: 'pg-empty'}, 'Opaque token: not a JWT, nothing to decode.'),
    decoded && [
      h('div', {className: 'pg-section-label'}, 'Header'),
      claimsTable(decoded.header, now),
      h('div', {className: 'pg-section-label'}, 'Payload'),
      claimsTable(decoded.payload, now),
    ],
  );
};

export const renderTokens = (root: HTMLElement, scope: Scope): void => {
  const content: HTMLElement = h('div', {style: 'display:contents'});
  const expiry: HTMLElement = h('strong', {});
  let session: SessionSnapshot = EMPTY_SESSION;

  const updateExpiry = (): void => {
    expiry.textContent = session.expiresAt ? formatDuration(session.expiresAt - Date.now()) : 'Unknown';
  };

  const render = (): void => {
    const {initialized, signedIn} = sdkState.get();

    mount(
      content,
      !signedIn &&
        h(
          'div',
          {className: 'pg-warning', role: 'status'},
          initialized ? 'Sign in from the Overview page to see tokens.' : 'The SDK is still initializing.',
        ),
      session.error && h('div', {className: 'pg-warning', role: 'alert'}, session.error),
      signedIn &&
        h(
          'div',
          {className: 'pg-stats'},
          h(
            'div',
            {className: 'pg-stat'},
            h('div', {className: 'pg-stat-label'}, 'Access token expires'),
            h(
              'div',
              {className: 'pg-stat-value'},
              expiry,
              h('span', {}, session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : 'opaque token'),
            ),
          ),
          h(
            'div',
            {className: 'pg-stat'},
            h('div', {className: 'pg-stat-label'}, 'Issued'),
            h(
              'div',
              {className: 'pg-stat-value'},
              h('strong', {}, session.issuedAt ? new Date(session.issuedAt).toLocaleTimeString() : 'Unknown'),
              h('span', {}, 'from the access token iat'),
            ),
          ),
          h(
            'div',
            {className: 'pg-stat'},
            h('div', {className: 'pg-stat-label'}, 'Scope'),
            h('div', {className: 'pg-stat-value'}, h('span', {className: 'pg-mono'}, session.scope ?? 'unknown')),
          ),
        ),
      h(
        'div',
        {className: 'pg-grid-2'},
        tokenCard('Access token', 'getAccessToken()', session.accessToken, decodeJwt(session.accessToken)),
        tokenCard(
          'ID token',
          'getIdToken() · getDecodedIdToken()',
          session.idToken,
          session.idToken ? (decodeJwt(session.idToken) ?? {header: {}, payload: session.idClaims ?? {}}) : null,
        ),
      ),
    );
    updateExpiry();
  };

  const reload = async (): Promise<void> => {
    session = await loadSession();
    render();
  };

  render();
  void reload();
  scope.add(sdkState.subscribe(() => void reload()));
  scope.interval(updateExpiry, 1000);

  mount(
    root,
    h(
      'main',
      {className: 'pg-main'},
      h(
        'div',
        {className: 'pg-heading'},
        h(
          'div',
          {},
          h('h1', {}, 'Tokens'),
          h(
            'p',
            {},
            'Tokens held by ThunderIDBrowserClient for this session, decoded locally. Nothing on this page is verified or sent anywhere.',
          ),
        ),
        h('button', {className: 'pg-btn', onclick: () => void reload(), type: 'button'}, 'Reload from SDK'),
      ),
      content,
    ),
  );
};
