// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/node';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import getClient from '../../getClient';
import getAuthFlowsAction from '../getAuthFlowsAction';
import getSessionId from '../getSessionId';

vi.mock('../getSessionId', () => ({default: vi.fn()}));
vi.mock('../../getClient', () => ({default: vi.fn()}));

const mockGetFlows = vi.fn();

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

describe('getAuthFlowsAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getClient).mockReturnValue({getFlows: mockGetFlows} as unknown as ReturnType<typeof getClient>);
    vi.mocked(getSessionId).mockResolvedValue('session-1');
  });

  it('refuses without a session and never reaches the upstream flow list', async () => {
    vi.mocked(getSessionId).mockResolvedValue(undefined);

    const result = await getAuthFlowsAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load auth flows (HTTP 401).', statusCode: 401, success: false});
    expect(mockGetFlows).not.toHaveBeenCalled();
  });

  it('lists only authentication flows with the server-resolved session and returns only the options', async () => {
    mockGetFlows.mockResolvedValue(flowsPage);

    const result = await getAuthFlowsAction({limit: 2, offset: 0});

    expect(mockGetFlows).toHaveBeenCalledWith({flowType: 'AUTHENTICATION', limit: 2, offset: 0}, 'session-1');
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

  it('does not let the caller choose the session, the flow type or any other field', async () => {
    mockGetFlows.mockResolvedValue(flowsPage);

    await getAuthFlowsAction({
      flowType: 'REGISTRATION',
      limit: 2,
      offset: 0,
      sessionId: 'someone-elses-session',
    } as never);

    expect(mockGetFlows).toHaveBeenCalledWith({flowType: 'AUTHENTICATION', limit: 2, offset: 0}, 'session-1');
  });

  it('caps the page size at what the backend serves and leaves an unset size to the server', async () => {
    mockGetFlows.mockResolvedValue(flowsPage);

    await getAuthFlowsAction({limit: 500, offset: 0});
    await getAuthFlowsAction({offset: 0});

    expect(mockGetFlows).toHaveBeenNthCalledWith(1, expect.objectContaining({limit: 100}), 'session-1');
    expect(mockGetFlows).toHaveBeenNthCalledWith(2, expect.objectContaining({limit: undefined}), 'session-1');
  });

  it("carries a ThunderIDAPIError's status across the boundary instead of throwing", async () => {
    mockGetFlows.mockRejectedValue(new ThunderIDAPIError('Forbidden', 'getFlows-ResponseError-001', 'javascript', 403));

    const result = await getAuthFlowsAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load auth flows (HTTP 403).', statusCode: 403, success: false});
  });

  it('does not leak the text of an unexpected error', async () => {
    mockGetFlows.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:8090'));

    const result = await getAuthFlowsAction({limit: 30, offset: 0});

    expect(result).toEqual({message: 'Failed to load auth flows.', success: false});
  });

  it('does not repeat the reply of the upstream, which a proxy or the server controls', async () => {
    mockGetFlows.mockRejectedValue(
      new ThunderIDAPIError(
        '<html>403 from internal-proxy-7.corp.local</html>',
        'test-ResponseError-001',
        'javascript',
        403,
      ),
    );

    const result = await getAuthFlowsAction({limit: 30, offset: 0});

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
      mockGetFlows
        .mockRejectedValueOnce(new ThunderIDAPIError('Unavailable', 'getFlows-ResponseError-001', 'javascript', 503))
        .mockResolvedValue(flowsPage);

      const pending = getAuthFlowsAction({limit: 30, offset: 0});
      await vi.advanceTimersByTimeAsync(500);

      expect(await pending).toMatchObject({success: true});
      expect(mockGetFlows).toHaveBeenCalledTimes(2);
    });

    it('does not retry a client error and carries its status to the browser', async () => {
      mockGetFlows.mockRejectedValue(
        new ThunderIDAPIError('Forbidden', 'getFlows-ResponseError-001', 'javascript', 403),
      );

      const result = await getAuthFlowsAction({limit: 30, offset: 0});

      expect(mockGetFlows).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({statusCode: 403, success: false});
    });

    it('gives up after one retry and carries the status of the last failure', async () => {
      mockGetFlows.mockRejectedValue(
        new ThunderIDAPIError('Unavailable', 'getFlows-ResponseError-001', 'javascript', 503),
      );

      const pending = getAuthFlowsAction({limit: 30, offset: 0});
      await vi.advanceTimersByTimeAsync(500);

      expect(await pending).toMatchObject({statusCode: 503, success: false});
      expect(mockGetFlows).toHaveBeenCalledTimes(2);
    });

    it('does not retry an unexpected error', async () => {
      mockGetFlows.mockRejectedValue(new Error('boom'));

      await getAuthFlowsAction({limit: 30, offset: 0});

      expect(mockGetFlows).toHaveBeenCalledTimes(1);
    });
  });

  describe('a request that is not what the types promise', () => {
    it.each([
      ['a non-numeric limit', {limit: 'abc'}],
      ['a negative offset', {offset: -1}],
      ['a fractional limit', {limit: 1.5}],
    ])('refuses %s without reaching the flow list', async (_label, request) => {
      const result = await getAuthFlowsAction(request as never);

      expect(result).toEqual({message: 'Failed to load auth flows (HTTP 400).', statusCode: 400, success: false});
      expect(mockGetFlows).not.toHaveBeenCalled();
    });

    it('ignores a filter, which this list does not take', async () => {
      mockGetFlows.mockResolvedValue({count: 0, flows: [], links: [], startIndex: 1, totalResults: 0});

      await getAuthFlowsAction({filter: 'name eq "x"', limit: 5, offset: 0} as never);

      expect(mockGetFlows).toHaveBeenCalledWith({flowType: 'AUTHENTICATION', limit: 5, offset: 0}, 'session-1');
    });
  });
});
