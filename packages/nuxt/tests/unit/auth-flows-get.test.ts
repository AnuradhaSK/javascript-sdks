// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError} from '@thunderid/node';
import {getQuery} from 'h3';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import authFlowsHandler from '../../src/runtime/server/routes/auth/select/auth-flows.get';
import {verifyAndRehydrateSession} from '../../src/runtime/server/utils/serverSession';

// ── vi.hoisted ────────────────────────────────────────────────────────────────
const mockClientInstance = vi.hoisted(() => ({
  getFlows: vi.fn<(...args: any[]) => Promise<any>>(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: vi.fn(),
  createError: vi.fn((opts: any) => Object.assign(new Error(opts.statusMessage), opts)),
}));

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => ({thunderid: {sessionSecret: 'test-secret'}})),
}));

vi.mock('../../src/runtime/server/ThunderIDNuxtClient', () => ({
  default: {getInstance: () => mockClientInstance},
}));

vi.mock('../../src/runtime/server/utils/serverSession', () => ({
  verifyAndRehydrateSession: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockEvent = {};

const flowsPage = {
  count: 2,
  flows: [
    {handle: 'password', id: 'flow-1', name: 'Password login'},
    {handle: 'passkey', id: 'flow-2', name: 'Passkey login'},
  ],
  links: [],
  startIndex: 1,
  totalResults: 5,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/auth-flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getQuery).mockReturnValue({});
  });

  it('rejects an invalid or missing session with 401 and never calls the flow list', async () => {
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue(null as any);

    await expect((authFlowsHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 401});
    expect(mockClientInstance.getFlows).not.toHaveBeenCalled();
  });

  it('lists only authentication flows with the server-resolved session and returns only the options', async () => {
    vi.mocked(getQuery).mockReturnValue({limit: '2', offset: '0'});
    mockClientInstance.getFlows.mockResolvedValue(flowsPage);

    const result = await (authFlowsHandler as any)(mockEvent);

    expect(mockClientInstance.getFlows).toHaveBeenCalledWith(
      {flowType: 'AUTHENTICATION', limit: 2, offset: 0},
      'session-1',
    );
    expect(result).toEqual({
      page: {
        nextOffset: 2,
        options: [
          {label: 'Password login', value: 'flow-1'},
          {label: 'Passkey login', value: 'flow-2'},
        ],
        totalResults: 5,
      },
      success: true,
    });
  });

  it('ignores a session, URL, flow type or filter smuggled in through the query string', async () => {
    vi.mocked(getQuery).mockReturnValue({
      filter: 'name eq "x"',
      flowType: 'REGISTRATION',
      sessionId: 'someone-elses-session',
      url: 'https://evil.example/flows',
    });
    mockClientInstance.getFlows.mockResolvedValue(flowsPage);

    await (authFlowsHandler as any)(mockEvent);

    expect(mockClientInstance.getFlows).toHaveBeenCalledWith(
      {flowType: 'AUTHENTICATION', limit: undefined, offset: undefined},
      'session-1',
    );
  });

  it('caps the page size at what the backend serves', async () => {
    vi.mocked(getQuery).mockReturnValue({limit: '500'});
    mockClientInstance.getFlows.mockResolvedValue(flowsPage);

    await (authFlowsHandler as any)(mockEvent);

    expect(mockClientInstance.getFlows).toHaveBeenCalledWith(expect.objectContaining({limit: 100}), 'session-1');
  });

  it.each([
    ['a non-numeric limit', {limit: 'abc'}],
    ['a negative offset', {offset: '-1'}],
    ['a fractional limit', {limit: '1.5'}],
    ['a repeated limit', {limit: ['1', '2']}],
  ])('rejects %s with 400 before reaching the flow list', async (_label, query) => {
    vi.mocked(getQuery).mockReturnValue(query);

    await expect((authFlowsHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 400});
    expect(mockClientInstance.getFlows).not.toHaveBeenCalled();
  });

  it("carries a ThunderIDAPIError's status in the body of a 200 instead of throwing", async () => {
    mockClientInstance.getFlows.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getFlows-ResponseError-001', 'javascript', 403),
    );

    const result = await (authFlowsHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load auth flows (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockClientInstance.getFlows.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await (authFlowsHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load auth flows.', success: false});
  });

  it('does not repeat the reply of the upstream, which a proxy or the server controls', async () => {
    mockClientInstance.getFlows.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy-7.corp.local</html>',
        'test-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await (authFlowsHandler as any)(mockEvent);

    expect(JSON.stringify(result)).not.toContain('internal-proxy-7');
  });
});

describe('retry on the server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getQuery).mockReturnValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a server error once and returns the second result', async () => {
    mockClientInstance.getFlows
      .mockRejectedValueOnce(new ThunderIDAPIError('Unavailable', 'getFlows-ResponseError-001', 'javascript', 503))
      .mockResolvedValue(flowsPage);

    const pending = (authFlowsHandler as any)(mockEvent);
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toMatchObject({success: true});
    expect(mockClientInstance.getFlows).toHaveBeenCalledTimes(2);
  });

  it('does not retry a client error and carries its status to the browser', async () => {
    mockClientInstance.getFlows.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getFlows-ResponseError-001', 'javascript', 403),
    );

    const result = await (authFlowsHandler as any)(mockEvent);

    expect(mockClientInstance.getFlows).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({statusCode: 403, success: false});
  });

  it('gives up after one retry and carries the status of the last failure', async () => {
    mockClientInstance.getFlows.mockRejectedValue(
      new ThunderIDAPIError('Unavailable', 'getFlows-ResponseError-001', 'javascript', 503),
    );

    const pending = (authFlowsHandler as any)(mockEvent);
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toMatchObject({statusCode: 503, success: false});
    expect(mockClientInstance.getFlows).toHaveBeenCalledTimes(2);
  });
});
