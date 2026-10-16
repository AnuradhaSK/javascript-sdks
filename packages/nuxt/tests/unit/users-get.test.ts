// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/typedef, sort-keys, @typescript-eslint/explicit-function-return-type */

import {ThunderIDAPIError} from '@thunderid/node';
import {getQuery} from 'h3';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

import usersHandler from '../../src/runtime/server/routes/auth/user/users.get';
import {verifyAndRehydrateSession} from '../../src/runtime/server/utils/serverSession';

// ── vi.hoisted ────────────────────────────────────────────────────────────────
const mockClientInstance = vi.hoisted(() => ({
  getUsers: vi.fn<(...args: any[]) => Promise<any>>(),
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

const usersPage = {
  count: 2,
  links: [],
  startIndex: 0,
  totalResults: 5,
  users: [
    {display: 'Jane Doe', id: 'user-1'},
    {display: 'John Roe', id: 'user-2'},
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/auth/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue({sessionId: 'session-1'} as any);
    vi.mocked(getQuery).mockReturnValue({});
  });

  it('rejects an invalid or missing session with 401 and never calls the directory', async () => {
    vi.mocked(verifyAndRehydrateSession).mockResolvedValue(null as any);

    await expect((usersHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 401});
    expect(mockClientInstance.getUsers).not.toHaveBeenCalled();
  });

  it('loads a page with the server-resolved session and returns only the normalized options', async () => {
    vi.mocked(getQuery).mockReturnValue({filter: 'department eq "Engineering"', limit: '2', offset: '0'});
    mockClientInstance.getUsers.mockResolvedValue(usersPage);

    const result = await (usersHandler as any)(mockEvent);

    expect(mockClientInstance.getUsers).toHaveBeenCalledWith(
      {filter: 'department eq "Engineering"', limit: 2, offset: 0},
      'session-1',
    );
    expect(result).toEqual({
      page: {
        nextOffset: 2,
        options: [
          {label: 'Jane Doe', value: 'user-1'},
          {label: 'John Roe', value: 'user-2'},
        ],
        totalResults: 5,
      },
      success: true,
    });
  });

  it('treats every query parameter as optional', async () => {
    mockClientInstance.getUsers.mockResolvedValue(usersPage);

    await (usersHandler as any)(mockEvent);

    expect(mockClientInstance.getUsers).toHaveBeenCalledWith(
      {filter: undefined, limit: undefined, offset: undefined},
      'session-1',
    );
  });

  it('ignores a session or URL smuggled in through the query string', async () => {
    vi.mocked(getQuery).mockReturnValue({sessionId: 'someone-elses-session', url: 'https://evil.example/users'});
    mockClientInstance.getUsers.mockResolvedValue(usersPage);

    await (usersHandler as any)(mockEvent);

    expect(mockClientInstance.getUsers).toHaveBeenCalledWith(
      {filter: undefined, limit: undefined, offset: undefined},
      'session-1',
    );
  });

  it.each([
    ['a non-numeric limit', {limit: 'abc'}],
    ['a negative offset', {offset: '-1'}],
    ['a fractional limit', {limit: '1.5'}],
    ['a repeated limit', {limit: ['1', '2']}],
    ['a repeated filter', {filter: ['a', 'b']}],
    ['an oversized filter', {filter: 'x'.repeat(513)}],
  ])('rejects %s with 400 before reaching the directory', async (_label, query) => {
    vi.mocked(getQuery).mockReturnValue(query);

    await expect((usersHandler as any)(mockEvent)).rejects.toMatchObject({statusCode: 400});
    expect(mockClientInstance.getUsers).not.toHaveBeenCalled();
  });

  it("carries a ThunderIDAPIError's status in the body of a 200 instead of throwing", async () => {
    mockClientInstance.getUsers.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getUsers-ResponseError-001', 'javascript', 403),
    );

    const result = await (usersHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load users (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockClientInstance.getUsers.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await (usersHandler as any)(mockEvent);

    expect(result).toEqual({message: 'Failed to load users.', success: false});
  });

  it('does not repeat the reply of the upstream, which a proxy or the server controls', async () => {
    mockClientInstance.getUsers.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy-7.corp.local</html>',
        'test-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await (usersHandler as any)(mockEvent);

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
    mockClientInstance.getUsers
      .mockRejectedValueOnce(new ThunderIDAPIError('Unavailable', 'getUsers-ResponseError-001', 'javascript', 503))
      .mockResolvedValue(usersPage);

    const pending = (usersHandler as any)(mockEvent);
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toMatchObject({success: true});
    expect(mockClientInstance.getUsers).toHaveBeenCalledTimes(2);
  });

  it('does not retry a client error and carries its status to the browser', async () => {
    mockClientInstance.getUsers.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getUsers-ResponseError-001', 'javascript', 403),
    );

    const result = await (usersHandler as any)(mockEvent);

    expect(mockClientInstance.getUsers).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({statusCode: 403, success: false});
  });

  it('gives up after one retry and carries the status of the last failure', async () => {
    mockClientInstance.getUsers.mockRejectedValue(
      new ThunderIDAPIError('Unavailable', 'getUsers-ResponseError-001', 'javascript', 503),
    );

    const pending = (usersHandler as any)(mockEvent);
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toMatchObject({statusCode: 503, success: false});
    expect(mockClientInstance.getUsers).toHaveBeenCalledTimes(2);
  });
});
