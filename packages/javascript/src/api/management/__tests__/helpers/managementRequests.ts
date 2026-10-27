// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {expect, it, vi, type Mock} from 'vitest';
import ThunderIDAPIError from '../../../../errors/ThunderIDAPIError';
import {ApiFetcher} from '../../../../models/api';

export type FetcherMock = Mock<ApiFetcher>;

/**
 * Runs one management operation against the given fetcher.
 */
export type Run = (fetcher: ApiFetcher) => Promise<unknown>;

/**
 * An operation, the method it must send, the path it must address under `baseUrl` (with its query), and
 * the body it must send.
 */
export type RequestCase = [name: string, run: Run, method: string, path: string, body?: unknown];

export interface SentRequest {
  body: unknown;
  method: string | undefined;
  url: string;
}

export const baseUrl = 'https://localhost:8090';

export const respond = (body: unknown, status = 200, statusText = 'OK'): Response =>
  ({
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as Response;

export const createFetcher = (body: unknown = {}, status = 200): FetcherMock =>
  vi.fn<ApiFetcher>().mockResolvedValue(respond(body, status, status === 200 ? 'OK' : 'Error'));

export const requests = (fetcher: FetcherMock): SentRequest[] =>
  fetcher.mock.calls.map(([url, init]: Parameters<ApiFetcher>) => ({
    body: init?.body ? (JSON.parse(init.body as string) as unknown) : undefined,
    method: init?.method,
    url,
  }));

/**
 * Checks that each operation sends one request with the given method, URL and body.
 */
export const itSendsRequests = (cases: RequestCase[]): void => {
  it.each<RequestCase>(cases)('%s sends %s %s', async (_name, run, method, path, body) => {
    const fetcher: FetcherMock = createFetcher();

    await run(fetcher);

    expect(requests(fetcher)).toEqual([{body, method, url: `${baseUrl}${path}`}]);
  });
};

/**
 * Checks that an operation maps HTTP 403 and 404 to their own error codes and keeps the server's error.
 */
export const itMapsForbiddenAndNotFound = (name: string, run: Run): void => {
  it.each<[number, string]>([
    [403, 'ForbiddenError'],
    [404, 'NotFoundError'],
  ])(`${name} maps HTTP %i to %s`, async (status: number, kind: string) => {
    const error: unknown = await run(
      createFetcher({code: 'SRV-1001', message: {defaultValue: 'Refused'}}, status),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ThunderIDAPIError);
    expect(error).toMatchObject({code: `${name}-${kind}-001`, serverError: {code: 'SRV-1001'}, statusCode: status});
  });
};
