// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {client, refreshSdkState, SdkState, sdkState} from '../lib/client';
import {h, mount} from '../lib/dom';
import {describeError, track} from '../lib/events';
import {formatClaim, formatDuration} from '../lib/jwt';
import {href} from '../lib/router';
import {EMPTY_SESSION, loadSession, SessionSnapshot} from '../lib/session';
import {Scope} from '../lib/store';
import {asText, getDisplayName, getEmail, getInitials} from '../lib/user';

/**
 * The session card: who is signed in, an access token countdown, key claims, and sign in, refresh,
 * and sign out actions.
 */
export const sessionCard = (scope: Scope): HTMLElement => {
  const pill: HTMLElement = h('span', {className: 'pg-pill'});
  const body: HTMLElement = h('div', {className: 'pg-card-body'});
  let session: SessionSnapshot = EMPTY_SESSION;
  let busy: string | null = null;
  let error: string | null = null;
  let progressHead: HTMLElement | null = null;
  let progressBar: HTMLElement | null = null;

  const updateCountdown = (): void => {
    if (!progressHead || !progressBar) return;

    const now: number = Date.now();
    const remaining: number | null = session.expiresAt ? session.expiresAt - now : null;
    const lifetime: number | null = session.expiresAt && session.issuedAt ? session.expiresAt - session.issuedAt : null;
    const percent: number =
      remaining !== null && lifetime ? Math.max(0, Math.min(100, (remaining / lifetime) * 100)) : 0;

    let label = 'expiry unknown (opaque token)';

    if (remaining !== null) label = remaining > 0 ? `expires in ${formatDuration(remaining)}` : 'expired';

    mount(progressHead, h('span', {}, 'Access token'), h('span', {className: 'pg-mono'}, label));
    progressBar.setAttribute('aria-valuenow', String(Math.round(percent)));
    (progressBar.firstElementChild as HTMLElement).style.width = `${percent}%`;
  };

  const render = (): void => {
    const {initialized, signedIn, user}: SdkState = sdkState.get();

    pill.textContent = signedIn ? 'Signed in' : initialized ? 'Signed out' : 'Initializing';

    if (signedIn) pill.dataset['state'] = 'ok';
    else if (initialized) delete pill.dataset['state'];
    else pill.dataset['state'] = 'warn';

    const claims: [string, unknown][] = session.idClaims
      ? (
          [
            ['sub', session.idClaims['sub']],
            ['scope', session.scope ?? session.idClaims['scope']],
            ['amr', session.idClaims['amr']],
          ] as [string, unknown][]
        ).filter(([, value]: [string, unknown]) => value !== undefined)
      : [];

    const act = async (label: string, call: () => Promise<unknown>): Promise<void> => {
      busy = label;
      error = null;
      render();

      try {
        await track(label, call);
      } catch (caught) {
        error = describeError(caught);
      } finally {
        busy = null;
        await refreshSdkState();
        session = await loadSession();
        render();
      }
    };

    progressHead = signedIn ? h('div', {className: 'pg-progress-head'}) : null;
    progressBar = signedIn
      ? h(
          'div',
          {
            'aria-label': 'Access token lifetime remaining',
            'aria-valuemax': 100,
            'aria-valuemin': 0,
            className: 'pg-progress',
            role: 'progressbar',
          },
          h('div', {}),
        )
      : null;

    mount(
      body,
      h(
        'div',
        {className: 'pg-user'},
        h(
          'div',
          {'aria-hidden': 'true', className: 'pg-avatar', 'data-anon': String(!signedIn), 'data-size': 'lg'},
          signedIn ? getInitials(user) : '?',
        ),
        h(
          'div',
          {},
          h('div', {className: 'pg-user-name'}, signedIn ? getDisplayName(user) : 'No active session'),
          h(
            'div',
            {className: 'pg-user-sub'},
            signedIn ? (getEmail(user) ?? asText(user?.['sub'])) : 'Sign in to inspect tokens and claims.',
          ),
        ),
      ),
      signedIn && h('div', {}, progressHead, progressBar),
      claims.length > 0 &&
        h(
          'dl',
          {className: 'pg-dl'},
          claims.map(([key, value]: [string, unknown]) => [h('dt', {}, key), h('dd', {}, formatClaim(value))]),
        ),
      (error ?? session.error) && h('p', {className: 'pg-cap-note', 'data-status': 'fail'}, error ?? session.error),
      h(
        'div',
        {className: 'pg-row'},
        signedIn
          ? [
              h(
                'button',
                {
                  className: 'pg-btn',
                  disabled: !!busy,
                  onclick: () => void act('refreshAccessToken', () => client.refreshAccessToken()),
                  type: 'button',
                },
                busy === 'refreshAccessToken' ? 'Refreshing' : 'Refresh token',
              ),
              h('a', {className: 'pg-btn', href: href('tokens')}, 'Decode tokens'),
              h(
                'button',
                {
                  className: 'pg-btn',
                  'data-variant': 'danger',
                  disabled: !!busy,
                  onclick: () => void act('signOut', () => client.signOut()),
                  type: 'button',
                },
                'Sign out',
              ),
            ]
          : h(
              'button',
              {
                className: 'pg-btn',
                'data-variant': 'primary',
                disabled: !!busy || !initialized,
                onclick: () => void act('signIn', () => client.signIn()),
                type: 'button',
              },
              'Sign in',
            ),
      ),
    );

    updateCountdown();
  };

  const reload = async (): Promise<void> => {
    session = await loadSession();
    render();
  };

  render();
  void reload();
  scope.add(sdkState.subscribe(() => void reload()));
  scope.interval(updateCountdown, 1000);

  return h(
    'section',
    {'aria-label': 'Session', className: 'pg-card'},
    h('div', {className: 'pg-card-head'}, h('h2', {}, 'Session'), pill),
    body,
  );
};
