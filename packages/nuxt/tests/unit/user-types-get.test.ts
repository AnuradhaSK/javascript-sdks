// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError} from '@thunderid/node';
import {getQuery} from 'h3';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import userTypesHandler from '../../src/runtime/server/routes/auth/select/user-types.get';
import {verifyAndRehydrateSession} from '../../src/runtime/server/utils/serverSession';

// ── vi.hoisted ────────────────────────────────────────────────────────────────
const mockClientInstance = vi.hoisted(() => ({
  getUserTypes: vi.fn<(...args: any[]) => Promise<any>>(),
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

const typesPage = {
  count: 2,
  links: [],
  startIndex: 1,
  totalResults: 5,
  types: [
    {displayName: 'Staff', handle: 'employee', id: 'type-1'},
    {displayName: 'Staff', handle: 'contractor', id: 'type-2'},
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/user-types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getQuery).mockReturnValue({});
  });

  it('rejects an invalid or missing session with 401 and never calls the user type list', async () => {
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue(null as any);

    await expect((userTypesHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 401});
    expect(mockClientInstance.getUserTypes).not.toHaveBeenCalled();
  });

  it('loads a page with the server-resolved session and returns only handles as options', async () => {
    vi.mocked(getQuery).mockReturnValue({limit: '2', offset: '0'});
    mockClientInstance.getUserTypes.mockResolvedValue(typesPage);

    const result = await (userTypesHandler as any)(mockEvent);

    expect(mockClientInstance.getUserTypes).toHaveBeenCalledWith({limit: 2, offset: 0}, 'session-1');
    expect(result).toEqual({
      page: {
        nextOffset: 2,
        options: [
          {label: 'employee', value: 'employee'},
          {label: 'contractor', value: 'contractor'},
        ],
        totalResults: 5,
      },
      success: true,
    });
  });

  it('ignores a session, URL or filter smuggled in through the query string', async () => {
    vi.mocked(getQuery).mockReturnValue({
      filter: 'handle eq "x"',
      sessionId: 'someone-elses-session',
      url: 'https://evil.example/user-types',
    });
    mockClientInstance.getUserTypes.mockResolvedValue(typesPage);

    await (userTypesHandler as any)(mockEvent);

    expect(mockClientInstance.getUserTypes).toHaveBeenCalledWith({limit: undefined, offset: undefined}, 'session-1');
  });

  it('caps the page size at what the backend serves', async () => {
    vi.mocked(getQuery).mockReturnValue({limit: '500'});
    mockClientInstance.getUserTypes.mockResolvedValue(typesPage);

    await (userTypesHandler as any)(mockEvent);

    expect(mockClientInstance.getUserTypes).toHaveBeenCalledWith(expect.objectContaining({limit: 100}), 'session-1');
  });

  it.each([
    ['a non-numeric limit', {limit: 'abc'}],
    ['a negative offset', {offset: '-1'}],
    ['a fractional limit', {limit: '1.5'}],
    ['a repeated limit', {limit: ['1', '2']}],
  ])('rejects %s with 400 before reaching the user type list', async (_label, query) => {
    vi.mocked(getQuery).mockReturnValue(query);

    await expect((userTypesHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 400});
    expect(mockClientInstance.getUserTypes).not.toHaveBeenCalled();
  });

  it("carries a ThunderIDAPIError's status in the body of a 200 instead of throwing", async () => {
    mockClientInstance.getUserTypes.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getUserTypes-ResponseError-001', 'javascript', 403),
    );

    const result = await (userTypesHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load user types (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockClientInstance.getUserTypes.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await (userTypesHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load user types.', success: false});
  });

  it('does not repeat the reply of the upstream, which a proxy or the server controls', async () => {
    mockClientInstance.getUserTypes.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy-7.corp.local</html>',
        'test-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await (userTypesHandler as any)(mockEvent);

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
    mockClientInstance.getUserTypes
      .mockRejectedValueOnce(new ThunderIDAPIError('Unavailable', 'getUserTypes-ResponseError-001', 'javascript', 503))
      .mockResolvedValue(typesPage);

    const pending = (userTypesHandler as any)(mockEvent);
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toMatchObject({success: true});
    expect(mockClientInstance.getUserTypes).toHaveBeenCalledTimes(2);
  });

  it('does not retry a client error and carries its status to the browser', async () => {
    mockClientInstance.getUserTypes.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getUserTypes-ResponseError-001', 'javascript', 403),
    );

    const result = await (userTypesHandler as any)(mockEvent);

    expect(mockClientInstance.getUserTypes).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({statusCode: 403, success: false});
  });

  it('gives up after one retry and carries the status of the last failure', async () => {
    mockClientInstance.getUserTypes.mockRejectedValue(
      new ThunderIDAPIError('Unavailable', 'getUserTypes-ResponseError-001', 'javascript', 503),
    );

    const pending = (userTypesHandler as any)(mockEvent);
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toMatchObject({statusCode: 503, success: false});
    expect(mockClientInstance.getUserTypes).toHaveBeenCalledTimes(2);
  });
});
