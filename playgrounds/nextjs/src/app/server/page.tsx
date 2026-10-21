// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ReactElement} from 'react';
import Trace from '../../components/Trace';
import {formatClaim, formatDuration} from '../../lib/jwt';
import {loadServerSession, maskToken, ServerSession} from '../../lib/serverSession';
import ApiExplorer from '../../server/ApiExplorer';

const CLAIMS: string[] = ['sub', 'iss', 'aud', 'scope', 'iat', 'exp'];

/**
 * A Server Component. Everything above the API explorer was read on the server, during this
 * request, through `thunderid()` from `@thunderid/nextjs/server`.
 */
const ServerPage = async (): Promise<ReactElement> => {
  const session: ServerSession = await loadServerSession();
  const claims: Record<string, unknown> = session.claims ?? {};
  const exp: unknown = claims['exp'];
  const remaining: number | null = typeof exp === 'number' ? exp * 1000 - session.renderedAt : null;

  return (
    <main className="pg-main">
      <div className="pg-heading">
        <div>
          <h1>Server</h1>
          <p>
            What server code sees. This page is a Server Component: it called{' '}
            <span className="pg-accent">thunderid()</span> while rendering, and the explorer below sends requests to the
            proxy, route handlers, and pages that use the SDK on the server.
          </p>
        </div>
      </div>

      <div className="pg-stats">
        <div className="pg-stat">
          <div className="pg-stat-label">Session</div>
          <div className="pg-stat-value">
            <strong style={{color: session.signedIn ? 'var(--pg-ok)' : undefined}}>
              {session.signedIn ? 'Signed in' : 'None'}
            </strong>
            <span>{session.sessionId ?? 'no session cookie'}</span>
          </div>
        </div>
        <div className="pg-stat">
          <div className="pg-stat-label">Access token expires</div>
          <div className="pg-stat-value">
            <strong>{remaining === null ? 'Unknown' : remaining > 0 ? formatDuration(remaining) : 'Expired'}</strong>
            <span>at render time</span>
          </div>
        </div>
        <div className="pg-stat">
          <div className="pg-stat-label">Rendered</div>
          <div className="pg-stat-value">
            <strong>{new Date(session.renderedAt).toISOString().slice(11, 19)}</strong>
            <span>UTC, on the server</span>
          </div>
        </div>
      </div>

      <div className="pg-grid-2">
        <section className="pg-card" aria-label="Server Component render">
          <div className="pg-card-head">
            <div>
              <h2>Server Component render</h2>
              <div className="pg-hook-sig">src/app/server/page.tsx</div>
            </div>
            <span className="pg-pill" data-state={session.error ? 'warn' : 'ok'}>
              {session.error ? 'Error' : 'OK'}
            </span>
          </div>
          <Trace steps={session.trace} />
          {session.error && (
            <p className="pg-cap-note" data-status="fail" style={{padding: '0 18px 16px'}}>
              {session.error}
            </p>
          )}
        </section>

        <section className="pg-card" aria-label="Session values">
          <div className="pg-card-head">
            <div>
              <h2>Session values</h2>
              <div className="pg-hook-sig">getSessionId() · getAccessToken(sessionId)</div>
            </div>
          </div>
          <div className="pg-card-body">
            <div className="pg-token" data-masked="true">
              {maskToken(session.accessToken) ?? 'No access token'}
            </div>
          </div>
          {session.claims ? (
            <table className="pg-claims">
              <tbody>
                {CLAIMS.filter((key: string) => claims[key] !== undefined).map((key: string) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{formatClaim(claims[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="pg-empty">Sign in to see the claims of the access token held in the session cookie.</p>
          )}
        </section>
      </div>

      <ApiExplorer />
    </main>
  );
};

export default ServerPage;
