// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useThunderID} from '@thunderid/react';
import {ReactElement, useEffect} from 'react';
import {Logo, ReactLogo} from './Icons';
import playgroundConfig from '../config';
import {checkServerHealth, useServerHealth} from '../lib/health';
import {href, Section} from '../lib/router';
import {toUser, SdkUser} from '../lib/sdk';
import {getDisplayName, getInitials} from '../lib/user';

const NAV: [Section, string, string][] = [
  ['overview', 'Overview', '#/'],
  ['components', 'Components', href('components')],
  ['hooks', 'Hooks', href('hooks')],
  ['tokens', 'Tokens', href('tokens')],
];

const TopBar = ({section}: {section: Section}): ReactElement => {
  const sdk = useThunderID();
  const {isSignedIn} = sdk;
  const user: SdkUser | null = toUser(sdk.user);
  const health = useServerHealth();

  useEffect(() => {
    void checkServerHealth();
  }, []);

  const host: string = playgroundConfig.baseUrl.replace(/^https?:\/\//, '');

  return (
    <header className="pg-topbar">
      <div className="pg-brand">
        <Logo />
        <span className="pg-brand-divider" aria-hidden="true" />
        <ReactLogo />
        <strong>React Playground</strong>
      </div>
      <nav aria-label="Playground sections" className="pg-nav">
        {NAV.map(([id, label, target]: [Section, string, string]) => (
          <a key={id} href={target} aria-current={section === id ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </nav>
      <div className="pg-spacer" />
      <span className="pg-server" title={health.detail}>
        <span className="pg-dot" data-state={health.state} />
        {host}
      </span>
      <div
        className="pg-avatar"
        data-anon={!isSignedIn}
        role="img"
        aria-label={isSignedIn ? `Signed in as ${getDisplayName(user)}` : 'Signed out'}
      >
        {isSignedIn ? getInitials(user) : '?'}
      </div>
    </header>
  );
};

export default TopBar;
