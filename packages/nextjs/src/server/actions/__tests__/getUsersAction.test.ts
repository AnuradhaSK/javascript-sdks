// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../getClient';
import getSessionId from '../getSessionId';
import getUsersAction from '../getUsersAction';

vi.mock('../getSessionId', () => ({default: vi.fn()}));
vi.mock('../../getClient', () => ({default: vi.fn()}));

const mockGetUsers = vi.fn();

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

describe('getUsersAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({getUsers: mockGetUsers} as unknown as ReturnType<typeof getClient>);
    vi.mocked(getSessionId).mockResolvedValue('session-1');
  });

  it('refuses without a session and never reaches the upstream directory', async () => {
    vi.mocked(getSessionId).mockResolvedValue(undefined);

    const result = await getUsersAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load users (HTTP 401).', statusCode: 401, success: false});
    expect(mockGetUsers).not.toHaveBeenCalled();
  });

  it('loads the page with the server-resolved session and returns only the normalized options', async () => {
    mockGetUsers.mockResolvedValue(usersPage);

    const result = await getUsersAction({filter: 'department eq "Engineering"', limit: 2, offset: 0});

    expect(mockGetUsers).toHaveBeenCalledWith(
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

  it('does not let the caller choose the session: extra request fields are ignored', async () => {
    mockGetUsers.mockResolvedValue(usersPage);

    await getUsersAction({limit: 2, offset: 0, sessionId: 'someone-elses-session'} as never);

    expect(mockGetUsers).toHaveBeenCalledWith({filter: undefined, limit: 2, offset: 0}, 'session-1');
  });

  it("carries a ThunderIDAPIError's status across the boundary instead of throwing", async () => {
    mockGetUsers.mockRejectedValue(new ThunderIDAPIError('Forbidden', 'getUsers-ResponseError-001', 'javascript', 403));

    const result = await getUsersAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load users (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockGetUsers.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await getUsersAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load users.', success: false});
  });

  it('does not repeat the reply of the upstream, which a proxy or the server controls', async () => {
    mockGetUsers.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy-7.corp.local</html>',
        'test-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await getUsersAction({limit: 30, offset: 0});

    expect(JSON.stringify(result)).not.toContain('internal-proxy-7');
  });

  describe('a request that is not what the types promise', () => {
    // A server action is a public endpoint, so the types do not protect it.
    it.each([
      ['a non-numeric limit', {limit: 'abc'}],
      ['a negative offset', {offset: -1}],
      ['a fractional limit', {limit: 1.5}],
      ['an object as the offset', {offset: {}}],
      ['a filter that is not a string', {filter: ['a']}],
      ['a filter that is far too long', {filter: 'x'.repeat(100_000)}],
    ])('refuses %s without reaching the upstream directory', async (_label, request) => {
      const result = await getUsersAction(request as never);

      expect(result).toEqual({message: 'Failed to load users (HTTP 400).', statusCode: 400, success: false});
      expect(mockGetUsers).not.toHaveBeenCalled();
    });

    it('accepts paging given as digits', async () => {
      mockGetUsers.mockResolvedValue(usersPage);

      await getUsersAction({limit: '5', offset: '10'} as never);

      expect(mockGetUsers).toHaveBeenCalledWith({filter: undefined, limit: 5, offset: 10}, 'session-1');
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('retries a server error once on the server and returns the second result', async () => {
      mockGetUsers
        .mockRejectedValueOnce(new ThunderIDAPIError('Unavailable', 'getUsers-ResponseError-001', 'javascript', 503))
        .mockResolvedValue(usersPage);

      const pending = getUsersAction({limit: 30, offset: 0});
      await vi.advanceTimersByTimeAsync(500);

      expect(await pending).toMatchObject({success: true});
      expect(mockGetUsers).toHaveBeenCalledTimes(2);
    });

    it('does not retry a client error and carries its status to the browser', async () => {
      mockGetUsers.mockRejectedValue(
        new ThunderIDAPIError('Forbidden', 'getUsers-ResponseError-001', 'javascript', 403),
      );

      const result = await getUsersAction({limit: 30, offset: 0});

      expect(mockGetUsers).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({statusCode: 403, success: false});
    });

    it('gives up after one retry and carries the status of the last failure', async () => {
      mockGetUsers.mockRejectedValue(
        new ThunderIDAPIError('Unavailable', 'getUsers-ResponseError-001', 'javascript', 503),
      );

      const pending = getUsersAction({limit: 30, offset: 0});
      await vi.advanceTimersByTimeAsync(500);

      expect(await pending).toMatchObject({statusCode: 503, success: false});
      expect(mockGetUsers).toHaveBeenCalledTimes(2);
    });

    it('does not retry an unexpected error', async () => {
      mockGetUsers.mockRejectedValue(new Error('boom'));

      await getUsersAction({limit: 30, offset: 0});

      expect(mockGetUsers).toHaveBeenCalledTimes(1);
    });
  });
});
