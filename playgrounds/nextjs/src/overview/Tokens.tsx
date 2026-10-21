// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {useThunderID} from '@thunderid/nextjs';
import {ReactElement, useState} from 'react';
import {decodeJwt, DecodedJwt, formatClaim, formatDuration, JwtClaims} from '../lib/jwt';
import {SessionSnapshot, useNow, useServerSession} from '../lib/session';

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

const ClaimsTable = ({claims, now}: {claims: JwtClaims; now: number}): ReactElement => (
  <table className="pg-claims">
    <tbody>
      {Object.entries(claims).map(([key, value]: [string, unknown]) => {
        const isTime: boolean = TIME_CLAIMS.includes(key) && typeof value === 'number';
        const at: number = isTime ? (value as number) * 1000 : 0;

        return (
          <tr key={key}>
            <th scope="row">{key}</th>
            <td>
              {formatClaim(value)}
              {isTime && (
                <small>
                  {new Date(at).toLocaleString()} ·{' '}
                  {at > now ? `in ${formatDuration(at - now)}` : `${formatDuration(now - at)} ago`}
                </small>
              )}
              {!isTime && CLAIM_NOTES[key] && <small>{CLAIM_NOTES[key]}</small>}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const TokenCard = ({
  decoded,
  label,
  now,
  source,
  token,
}: {
  decoded: DecodedJwt | null;
  label: string;
  now: number;
  source: string;
  token: string | null;
}): ReactElement => {
  const [revealed, setRevealed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const copy = async (): Promise<void> => {
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="pg-card" aria-label={label}>
      <div className="pg-card-head">
        <div>
          <h2>{label}</h2>
          <div className="pg-hook-sig">{source}</div>
        </div>
        <div className="pg-row">
          <button
            type="button"
            className="pg-btn"
            data-size="sm"
            disabled={!token}
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? 'Hide' : 'Reveal'}
          </button>
          <button type="button" className="pg-btn" data-size="sm" disabled={!token} onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="pg-card-body">
        <div className="pg-token" data-masked={!revealed}>
          {!token && 'No token'}
          {token && (revealed ? token : `${token.slice(0, 12)}${'•'.repeat(24)}${token.slice(-6)}`)}
        </div>
      </div>
      {token && !decoded && <p className="pg-empty">Opaque token: not a JWT, nothing to decode.</p>}
      {decoded && (
        <>
          <div className="pg-section-label">Header</div>
          <ClaimsTable claims={decoded.header} now={now} />
          <div className="pg-section-label">Payload</div>
          <ClaimsTable claims={decoded.payload} now={now} />
        </>
      )}
    </section>
  );
};

const Tokens = (): ReactElement => {
  const sdk = useThunderID();
  const isSignedIn = !!sdk.isSignedIn;
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const {error, loading, session}: SessionSnapshot = useServerSession(isSignedIn, refreshKey);
  const now: number = useNow();
  const accessToken: string | null = session?.accessToken ?? null;
  const decoded: DecodedJwt | null = decodeJwt(accessToken);
  const exp: unknown = decoded?.payload['exp'];
  const expiresAt: number | null = typeof exp === 'number' ? exp * 1000 : null;
  const scope: unknown = decoded?.payload['scope'];

  return (
    <main className="pg-main">
      <div className="pg-heading">
        <div>
          <h1>Tokens</h1>
          <p>
            @thunderid/nextjs keeps tokens on the server, in an HttpOnly session cookie. This page reads them through a
            server action that calls <span className="pg-mono">thunderid().getAccessToken()</span> and decodes them
            locally. Nothing here is verified.
          </p>
        </div>
        <button type="button" className="pg-btn" onClick={() => setRefreshKey((key: number) => key + 1)}>
          Reload from the server
        </button>
      </div>

      {!isSignedIn && (
        <div className="pg-warning" role="status">
          {sdk.isLoading ? 'The SDK is still loading.' : 'Sign in from the Overview page to see tokens.'}
        </div>
      )}
      {isSignedIn && error && (
        <div className="pg-warning" role="alert">
          {error}
        </div>
      )}

      {isSignedIn && (
        <div className="pg-stats">
          <div className="pg-stat">
            <div className="pg-stat-label">Access token expires</div>
            <div className="pg-stat-value">
              <strong>{expiresAt ? formatDuration(expiresAt - now) : loading ? 'Loading' : 'Unknown'}</strong>
              <span>{expiresAt ? new Date(expiresAt).toLocaleTimeString() : ''}</span>
            </div>
          </div>
          <div className="pg-stat">
            <div className="pg-stat-label">Session</div>
            <div className="pg-stat-value">
              <span className="pg-mono">{session?.sessionId ?? 'unknown'}</span>
            </div>
          </div>
          <div className="pg-stat">
            <div className="pg-stat-label">Scope</div>
            <div className="pg-stat-value">
              <span className="pg-mono">{typeof scope === 'string' ? scope : 'unknown'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="pg-grid-2">
        <TokenCard
          label="Access token"
          source="server action · thunderid().getAccessToken(sessionId)"
          token={accessToken}
          decoded={decoded}
          now={now}
        />
        <section className="pg-card" aria-label="ID token">
          <div className="pg-card-head">
            <div>
              <h2>ID token</h2>
              <div className="pg-hook-sig">no server API</div>
            </div>
            <span className="pg-pill">Unavailable</span>
          </div>
          <p className="pg-empty">
            @thunderid/nextjs does not keep the ID token after sign-in: the session cookie holds the access token, the
            refresh token, and a few claims, and <span className="pg-mono">thunderid()</span> offers no getIdToken() or
            getDecodedIdToken(). The user claims reach the client through{' '}
            <span className="pg-mono">useThunderID().user</span>.
          </p>
        </section>
      </div>
    </main>
  );
};

export default Tokens;
