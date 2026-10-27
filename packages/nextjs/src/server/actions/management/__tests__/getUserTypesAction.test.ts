// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../../getClient';
import getSessionId from '../../getSessionId';
import getUserTypesAction from '../getUserTypesAction';

vi.mock('../../getSessionId', () => ({default: vi.fn()}));
vi.mock('../../../getClient', () => ({default: vi.fn()}));

const mockGetUserTypes = vi.fn();

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

describe('getUserTypesAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({getUserTypes: mockGetUserTypes} as unknown as ReturnType<typeof getClient>);
    vi.mocked(getSessionId).mockResolvedValue('session-1');
  });

  it('refuses without a session and never reaches the upstream user type list', async () => {
    vi.mocked(getSessionId).mockResolvedValue(undefined);

    const result = await getUserTypesAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load user types (HTTP 401).', statusCode: 401, success: false});
    expect(mockGetUserTypes).not.toHaveBeenCalled();
  });

  it('loads the page with the server-resolved session and returns only handles as options', async () => {
    mockGetUserTypes.mockResolvedValue(typesPage);

    const result = await getUserTypesAction({limit: 2, offset: 0});

    expect(mockGetUserTypes).toHaveBeenCalledWith({limit: 2, offset: 0}, 'session-1');
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

  it('does not let the caller choose the session: extra request fields are ignored', async () => {
    mockGetUserTypes.mockResolvedValue(typesPage);

    await getUserTypesAction({limit: 2, offset: 0, sessionId: 'someone-elses-session'} as never);

    expect(mockGetUserTypes).toHaveBeenCalledWith({limit: 2, offset: 0}, 'session-1');
  });

  it('caps the page size at what the backend serves', async () => {
    mockGetUserTypes.mockResolvedValue(typesPage);

    await getUserTypesAction({limit: 500, offset: 0});

    expect(mockGetUserTypes).toHaveBeenCalledWith(expect.objectContaining({limit: 100}), 'session-1');
  });

  it("carries a ThunderIDAPIError's status across the boundary instead of throwing", async () => {
    mockGetUserTypes.mockRejectedValue(
      new ThunderIDAPIError('Forbidden', 'getUserTypes-ResponseError-001', 'javascript', 403),
    );

    const result = await getUserTypesAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load user types (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockGetUserTypes.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await getUserTypesAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load user types.', success: false});
  });

  it('does not repeat the reply of the upstream, which a proxy or the server controls', async () => {
    mockGetUserTypes.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy-7.corp.local</html>',
        'test-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await getUserTypesAction({limit: 30, offset: 0});

    expect(JSON.stringify(result)).not.toContain('internal-proxy-7');
  });

  describe('retry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('retries a server error once on the server and returns the second result', async () => {
      mockGetUserTypes
        .mockRejectedValueOnce(
          new ThunderIDAPIError('Unavailable', 'getUserTypes-ResponseError-001', 'javascript', 503),
        )
        .mockResolvedValue(typesPage);

      const pending = getUserTypesAction({limit: 30, offset: 0});
      await vi.advanceTimersByTimeAsync(500);

      expect(await pending).toMatchObject({success: true});
      expect(mockGetUserTypes).toHaveBeenCalledTimes(2);
    });

    it('does not retry a client error and carries its status to the browser', async () => {
      mockGetUserTypes.mockRejectedValue(
        new ThunderIDAPIError('Forbidden', 'getUserTypes-ResponseError-001', 'javascript', 403),
      );

      const result = await getUserTypesAction({limit: 30, offset: 0});

      expect(mockGetUserTypes).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({statusCode: 403, success: false});
    });

    it('gives up after one retry and carries the status of the last failure', async () => {
      mockGetUserTypes.mockRejectedValue(
        new ThunderIDAPIError('Unavailable', 'getUserTypes-ResponseError-001', 'javascript', 503),
      );

      const pending = getUserTypesAction({limit: 30, offset: 0});
      await vi.advanceTimersByTimeAsync(500);

      expect(await pending).toMatchObject({statusCode: 503, success: false});
      expect(mockGetUserTypes).toHaveBeenCalledTimes(2);
    });

    it('does not retry an unexpected error', async () => {
      mockGetUserTypes.mockRejectedValue(new Error('boom'));

      await getUserTypesAction({limit: 30, offset: 0});

      expect(mockGetUserTypes).toHaveBeenCalledTimes(1);
    });
  });
});
