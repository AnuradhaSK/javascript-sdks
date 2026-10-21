// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {useThunderID} from '@thunderid/nextjs';
import Link from 'next/link';
import {ReactElement, useState} from 'react';
import {describeError, track} from '../lib/events';
import {formatClaim, formatDuration, JwtClaims} from '../lib/jwt';
import {asText, sdkSignIn, sdkSignOut, toUser, SdkUser} from '../lib/sdk';
import {SessionSnapshot, useNow, useServerSession} from '../lib/session';
import {getDisplayName, getEmail, getInitials} from '../lib/user';

const SessionCard = (): ReactElement => {
  const sdk = useThunderID();
  const isSignedIn = !!sdk.isSignedIn;
  const isLoading = !!sdk.isLoading;
  const user: SdkUser | null = toUser(sdk.user);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {session}: SessionSnapshot = useServerSession(isSignedIn, refreshKey);
  const now: number = useNow();

  const act = async (label: string, call: () => Promise<unknown>): Promise<void> => {
    setBusy(label);
    setError(null);

    try {
      await track(label, call);
      setRefreshKey((key: number) => key + 1);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(null);
    }
  };

  const claims: JwtClaims = session?.claims ?? {};
  const exp: number | null = typeof claims['exp'] === 'number' ? claims['exp'] * 1000 : null;
  const iat: number | null = typeof claims['iat'] === 'number' ? claims['iat'] * 1000 : null;
  const remaining: number | null = exp !== null ? exp - now : null;
  const lifetime: number | null = exp !== null && iat !== null ? exp - iat : null;
  const percent: number = remaining !== null && lifetime ? Math.max(0, Math.min(100, (remaining / lifetime) * 100)) : 0;
  const rows: [string, unknown][] = (
    [
      ['sub', claims['sub']],
      ['scope', claims['scope']],
      ['session', session?.sessionId ?? undefined],
    ] as [string, unknown][]
  ).filter(([, value]: [string, unknown]) => value !== undefined && value !== null);

  return (
    <section aria-label="Session" className="pg-card">
      <div className="pg-card-head">
        <h2>Session</h2>
        <span className="pg-pill" data-state={isSignedIn ? 'ok' : isLoading ? 'warn' : undefined}>
          {isSignedIn ? 'Signed in' : isLoading ? 'Loading' : 'Signed out'}
        </span>
      </div>
      <div className="pg-card-body">
        <div className="pg-user">
          <div className="pg-avatar" data-size="lg" data-anon={!isSignedIn} aria-hidden="true">
            {isSignedIn ? getInitials(user) : '?'}
          </div>
          <div>
            <div className="pg-user-name">{isSignedIn ? getDisplayName(user) : 'No active session'}</div>
            <div className="pg-user-sub">
              {isSignedIn ? (getEmail(user) ?? asText(user?.['sub'])) : 'Sign in to inspect the server-held session.'}
            </div>
          </div>
        </div>

        {isSignedIn && (
          <div>
            <div className="pg-progress-head">
              <span>Access token</span>
              <span className="pg-mono">
                {remaining === null
                  ? 'expiry unknown'
                  : remaining > 0
                    ? `expires in ${formatDuration(remaining)}`
                    : 'expired'}
              </span>
            </div>
            <div
              className="pg-progress"
              role="progressbar"
              aria-label="Access token lifetime remaining"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
            >
              <div style={{width: `${percent}%`}} />
            </div>
          </div>
        )}

        {isSignedIn && rows.length > 0 && (
          <dl className="pg-dl">
            {rows.map(([key, value]: [string, unknown]) => (
              <div key={key} style={{display: 'contents'}}>
                <dt>{key}</dt>
                <dd>{formatClaim(value)}</dd>
              </div>
            ))}
          </dl>
        )}

        {(error ?? (isSignedIn ? session?.error : null)) && (
          <p className="pg-cap-note" data-status="fail">
            {error ?? session?.error}
          </p>
        )}

        <div className="pg-row">
          {isSignedIn ? (
            <>
              <button
                type="button"
                className="pg-btn"
                disabled={!!busy || !sdk.refreshToken}
                onClick={() => void act('refreshToken', () => sdk.refreshToken!())}
                title="useThunderID().refreshToken(): a server action that rotates the tokens in the session cookie"
              >
                {busy === 'refreshToken' ? 'Refreshing' : 'Refresh token'}
              </button>
              <Link className="pg-btn" href="/tokens">
                Decode tokens
              </Link>
              <button
                type="button"
                className="pg-btn"
                data-variant="danger"
                disabled={!!busy}
                onClick={() => void act('signOut', () => sdkSignOut(sdk))}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="pg-btn"
              data-variant="primary"
              disabled={!!busy || isLoading}
              onClick={() => void act('signIn', () => sdkSignIn(sdk))}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SessionCard;
