// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import Link from 'next/link';
import {ReactElement} from 'react';
import {loadServerSession, ServerSession} from '../../lib/serverSession';

/**
 * Behind `protectRoute()` in src/middleware.ts. Anonymous visitors never reach this render.
 */
const ProtectedPage = async (): Promise<ReactElement> => {
  const session: ServerSession = await loadServerSession();

  return (
    <main className="pg-main">
      <div className="pg-heading">
        <div>
          <h1>Protected page</h1>
          <p>
            <span className="pg-mono">thunderIDProxy()</span> let this request through because it carried a valid
            session. Without one, <span className="pg-mono">protectRoute()</span> redirects before the page renders.
          </p>
        </div>
        <Link className="pg-btn" href="/server">
          Back to Server
        </Link>
      </div>
      <section className="pg-card" aria-label="Session">
        <div className="pg-card-head">
          <h2>Rendered for</h2>
          <span className="pg-pill" data-state={session.signedIn ? 'ok' : 'warn'}>
            {session.signedIn ? 'Signed in' : 'No session'}
          </span>
        </div>
        <pre className="pg-pre">
          {JSON.stringify({sessionId: session.sessionId, sub: session.claims?.['sub'] ?? null}, null, 2)}
        </pre>
      </section>
    </main>
  );
};

export default ProtectedPage;
