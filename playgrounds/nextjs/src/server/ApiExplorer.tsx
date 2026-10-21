// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {useThunderID} from '@thunderid/nextjs';
import {ChangeEvent, ReactElement, useState} from 'react';
import {ENDPOINTS, Endpoint} from './endpoints';
import {Copy, Play, Spinner} from '../components/Icons';
import Trace from '../components/Trace';
import {describeError, logEvent} from '../lib/events';
import {asText} from '../lib/sdk';
import type {TraceStep} from '../lib/serverSession';

type Identity = 'session' | 'anonymous';
type ResponseTab = 'body' | 'headers' | 'trace';

interface Result {
  body: string;
  durationMs: number;
  headers: [string, string][];
  json: unknown;
  redirectedTo: string | null;
  status: number;
  statusText: string;
}

const IDENTITIES: [Identity, string, string][] = [
  ['session', 'Current session', 'sends the session cookie'],
  ['anonymous', 'Anonymous', 'no cookies (credentials: omit)'],
];

const MAX_BODY = 4000;

/**
 * Pulls an SDK trace out of a response: route handlers return the `thunderid()` calls they made,
 * and the proxy answers /api/proxy-trace with what `thunderIDProxy()` resolved.
 */
const traceOf = (endpoint: Endpoint, result: Result): TraceStep[] => {
  const json: Record<string, unknown> | null =
    result.json && typeof result.json === 'object' ? (result.json as Record<string, unknown>) : null;
  const steps: TraceStep[] = [];

  if (endpoint.proxied) {
    steps.push({
      detail: endpoint.protectedRoute
        ? 'createRouteMatcher() matched; protectRoute() checked the session'
        : 'ran before the route',
      durationMs: 0,
      kind: 'info',
      name: 'thunderIDProxy()',
    });
  }

  if (result.redirectedTo) {
    steps.push({
      detail: `no session: redirected to ${result.redirectedTo}`,
      durationMs: 0,
      kind: 'error',
      name: 'protectRoute()',
    });
  }

  if (json?.['handledBy'] === 'thunderIDProxy') {
    steps.push(
      {detail: asText(json['isSignedIn']), durationMs: 0, kind: 'ok', name: 'isSignedIn()'},
      {detail: asText(json['sessionId']) || 'undefined', durationMs: 0, kind: 'ok', name: 'getSessionId()'},
      {
        detail: json['session'] ? JSON.stringify(json['session']) : 'undefined',
        durationMs: 0,
        kind: json['session'] ? 'ok' : 'info',
        name: 'getSession()',
      },
    );
  }

  if (Array.isArray(json?.['trace'])) steps.push(...(json?.['trace'] as TraceStep[]));

  return steps;
};

const ApiExplorer = (): ReactElement => {
  const {isSignedIn} = useThunderID();
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);
  const [identity, setIdentity] = useState<Identity>('session');
  const [body, setBody] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ResponseTab>('body');
  const [showCurl, setShowCurl] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoint: Endpoint = ENDPOINTS.find((candidate: Endpoint) => candidate.id === selectedId) ?? ENDPOINTS[0];

  const select = (next: Endpoint): void => {
    setSelectedId(next.id);
    setBody(next.body ?? '');
    setResult(null);
    setError(null);
    setShowCurl(false);
    setTab('body');
  };

  const send = async (): Promise<void> => {
    setSending(true);
    setError(null);

    const started: number = performance.now();

    try {
      const response: Response = await fetch(endpoint.path, {
        body: endpoint.method === 'POST' ? body : undefined,
        cache: 'no-store',
        credentials: identity === 'session' ? 'same-origin' : 'omit',
        headers: endpoint.contentType ? {'content-type': endpoint.contentType} : undefined,
        method: endpoint.method,
      });
      const text: string = await response.text();
      let json: unknown = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // Not JSON.
      }

      const finalPath: string = new URL(response.url).pathname;
      const next: Result = {
        body: json === null ? text : JSON.stringify(json, null, 2),
        durationMs: performance.now() - started,
        headers: Array.from(response.headers.entries()),
        json,
        redirectedTo: response.redirected && finalPath !== endpoint.path ? finalPath : null,
        status: response.status,
        statusText: response.statusText,
      };

      setResult(next);
      logEvent(
        `${endpoint.method} ${endpoint.path}`,
        `${identity}: ${response.status}${next.redirectedTo ? ` after redirect to ${next.redirectedTo}` : ''}`,
        response.ok ? 'ok' : 'error',
      );
    } catch (caught) {
      setResult(null);
      setError(describeError(caught));
    } finally {
      setSending(false);
    }
  };

  const curl: string = [
    `curl -i -X ${endpoint.method} '${typeof window === 'undefined' ? '' : window.location.origin}${endpoint.path}'`,
    identity === 'session' ? "  -H 'Cookie: <your session cookie>'" : '',
    endpoint.contentType ? `  -H 'Content-Type: ${endpoint.contentType}'` : '',
    endpoint.method === 'POST' ? `  --data '${body}'` : '',
  ]
    .filter(Boolean)
    .join(' \\\n');

  const copyCurl = async (): Promise<void> => {
    setShowCurl(true);

    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const trace: TraceStep[] = result ? traceOf(endpoint, result) : [];
  const shownBody: string =
    result && result.body.length > MAX_BODY ? `${result.body.slice(0, MAX_BODY)}\n… (truncated)` : (result?.body ?? '');

  return (
    <section className="pg-card pg-api" aria-label="API explorer">
      <div className="pg-card-head">
        <div>
          <h2>API explorer</h2>
          <div className="pg-hook-sig">routes behind thunderIDProxy() in src/middleware.ts</div>
        </div>
      </div>
      <div className="pg-api-body">
        <nav className="pg-api-routes" aria-label="Routes">
          {ENDPOINTS.map((candidate: Endpoint) => (
            <button
              key={candidate.id}
              type="button"
              className="pg-route-btn"
              aria-current={candidate.id === endpoint.id ? 'true' : undefined}
              onClick={() => select(candidate)}
            >
              <span className="pg-method" data-method={candidate.method}>
                {candidate.method}
              </span>
              <span className="pg-route-path">{candidate.path}</span>
              {candidate.protectedRoute && <small title="Protected by protectRoute()">protected</small>}
            </button>
          ))}
        </nav>

        <div className="pg-api-main">
          <div className="pg-api-endpoint">
            <div className="pg-api-title">
              <span className="pg-method" data-method={endpoint.method}>
                {endpoint.method}
              </span>
              <strong>{endpoint.path}</strong>
              {endpoint.tags.map((tag: string) => (
                <span key={tag} className="pg-tag">
                  {tag}
                </span>
              ))}
            </div>
            <p>{endpoint.summary}</p>
          </div>

          <div className="pg-section-label">Send as</div>
          <div role="radiogroup" aria-label="Send as" className="pg-identities">
            {IDENTITIES.map(([id, label, detail]: [Identity, string, string]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={identity === id}
                className="pg-identity"
                onClick={() => setIdentity(id)}
              >
                <strong>{label}</strong>
                <small>{id === 'session' && !isSignedIn ? 'you are signed out' : detail}</small>
              </button>
            ))}
          </div>

          {endpoint.method === 'POST' && (
            <label className="pg-api-field">
              <span className="pg-section-label">Body ({endpoint.contentType})</span>
              <textarea
                className="pg-input"
                rows={3}
                spellCheck={false}
                value={body}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setBody(event.target.value)}
              />
            </label>
          )}

          <div className="pg-row pg-api-actions">
            <button
              type="button"
              className="pg-btn"
              data-variant="primary"
              disabled={sending}
              onClick={() => void send()}
            >
              {sending ? <Spinner /> : <Play />}
              Send request
            </button>
            <button type="button" className="pg-btn" onClick={() => void copyCurl()}>
              <Copy />
              {copied ? 'Copied' : 'Copy as cURL'}
            </button>
          </div>
          {showCurl && <pre className="pg-pre pg-api-curl">{curl}</pre>}

          <div className="pg-api-response">
            <div className="pg-api-response-head">
              <span className="pg-section-label">Response</span>
              {result && (
                <>
                  <span className="pg-status-badge" data-class={String(result.status)[0]}>
                    {result.status} {result.statusText}
                  </span>
                  <span className="pg-card-meta">
                    {result.durationMs.toFixed(0)} ms
                    {result.redirectedTo ? ` · followed a redirect to ${result.redirectedTo}` : ''}
                  </span>
                </>
              )}
              <div className="pg-spacer" />
              <div role="tablist" className="pg-segmented">
                {(['body', 'headers', 'trace'] as ResponseTab[]).map((id: ResponseTab) => (
                  <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                    {id === 'trace' ? 'SDK trace' : id === 'body' ? 'Body' : 'Headers'}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="pg-cap-note" data-status="fail">
                {error}
              </p>
            )}
            {!result && !error && (
              <p className="pg-empty">
                Send the request to see the response. The SDK trace shows what the proxy and the handler did.
              </p>
            )}
            {result && tab === 'body' && <pre className="pg-json">{shownBody || '(empty body)'}</pre>}
            {result && tab === 'headers' && (
              <table className="pg-claims">
                <tbody>
                  {result.headers.map(([name, value]: [string, string]) => (
                    <tr key={name}>
                      <th scope="row">{name}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {result && tab === 'trace' && <Trace steps={trace} />}
          </div>

          <div className="pg-section-label">Handler · {endpoint.file}</div>
          <pre className="pg-pre pg-api-source">{endpoint.source}</pre>
        </div>
      </div>
    </section>
  );
};

export default ApiExplorer;
