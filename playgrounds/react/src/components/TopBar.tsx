// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useThunderID} from '@thunderid/react';
import {ChangeEvent, ReactElement, useEffect} from 'react';
import {Logo} from './Icons';
import playgroundConfig from '../config';
import {checkServerHealth, useServerHealth} from '../lib/health';
import {href, Section} from '../lib/router';
import {toUser, SdkUser} from '../lib/sdk';
import {getDisplayName, getInitials} from '../lib/user';

interface SdkOption {
  href?: string;
  id: string;
  label: string;
}

const SDK_OPTIONS: SdkOption[] = [
  {id: 'react', label: 'React · @thunderid/react'},
  {href: playgroundConfig.expressPlaygroundUrl, id: 'express', label: 'Express · @thunderid/express'},
  {id: 'vue', label: 'Vue · @thunderid/vue (no playground yet)'},
  {id: 'nextjs', label: 'Next.js · @thunderid/nextjs (no playground yet)'},
  {id: 'browser', label: 'Browser · @thunderid/browser (no playground yet)'},
];

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

  const onSdkChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const option: SdkOption | undefined = SDK_OPTIONS.find((sdk: SdkOption) => sdk.id === event.target.value);

    if (option?.href) window.location.assign(option.href);
  };

  const host: string = playgroundConfig.baseUrl.replace(/^https?:\/\//, '');

  return (
    <header className="pg-topbar">
      <div className="pg-brand">
        <Logo />
        <strong>ThunderID</strong>
        <span>Playground</span>
      </div>
      <label className="pg-sdk-switch">
        <span className="pg-sdk-badge" aria-hidden="true">
          R
        </span>
        <select aria-label="SDK" value="react" onChange={onSdkChange}>
          {SDK_OPTIONS.map((sdk: SdkOption) => (
            <option key={sdk.id} value={sdk.id} disabled={sdk.id !== 'react' && !sdk.href}>
              {sdk.label}
            </option>
          ))}
        </select>
      </label>
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
