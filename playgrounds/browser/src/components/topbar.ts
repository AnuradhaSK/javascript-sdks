// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {javascriptLogo, logo} from './icons';
import playgroundConfig from '../config';
import {sdkState} from '../lib/client';
import {h, mount} from '../lib/dom';
import {healthStore} from '../lib/health';
import {href, Section} from '../lib/router';
import {Scope} from '../lib/store';
import {getDisplayName, getInitials} from '../lib/user';

const NAV: [Section, string, string][] = [
  ['overview', 'Overview', '#/'],
  ['helpers', 'UI helpers', href('helpers')],
  ['tokens', 'Tokens', href('tokens')],
];

/**
 * The header: `<ThunderID logo> | <JavaScript logo> Browser Playground`, section links, server
 * status, and the signed-in user.
 */
export const topBar = (scope: Scope, getSection: () => Section): HTMLElement => {
  const nav: HTMLElement = h('nav', {'aria-label': 'Playground sections', className: 'pg-nav'});
  const status: HTMLElement = h('span', {className: 'pg-server'});
  const avatar: HTMLElement = h('div', {className: 'pg-avatar', role: 'img'});
  const host: string = playgroundConfig.baseUrl.replace(/^https?:\/\//, '');

  const render = (): void => {
    const section: Section = getSection();

    mount(
      nav,
      NAV.map(([id, label, target]: [Section, string, string]) =>
        h('a', {'aria-current': section === id ? 'page' : undefined, href: target}, label),
      ),
    );

    const health = healthStore.get();

    status.title = health.detail;
    mount(status, h('span', {className: 'pg-dot', 'data-state': health.state}), host);

    const {signedIn, user} = sdkState.get();

    avatar.dataset['anon'] = String(!signedIn);
    avatar.setAttribute('aria-label', signedIn ? `Signed in as ${getDisplayName(user)}` : 'Signed out');
    avatar.textContent = signedIn ? getInitials(user) : '?';
  };

  render();
  scope.add(sdkState.subscribe(render));
  scope.add(healthStore.subscribe(render));
  window.addEventListener('hashchange', render);
  scope.add(() => window.removeEventListener('hashchange', render));

  return h(
    'header',
    {className: 'pg-topbar'},
    h(
      'div',
      {className: 'pg-brand'},
      logo(),
      h('span', {'aria-hidden': 'true', className: 'pg-brand-divider'}),
      javascriptLogo(),
      h('strong', {}, 'Browser Playground'),
    ),
    nav,
    h('div', {className: 'pg-spacer'}),
    status,
    avatar,
  );
};
