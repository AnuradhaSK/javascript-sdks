// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import loadPageWithRetryAndLog from '../loadPageWithRetryAndLog';

const log = vi.hoisted(() => ({debug: vi.fn(), error: vi.fn()}));

vi.mock('../logger', () => ({
  createPackageComponentLogger: () => ({debug: log.debug, error: log.error, info: vi.fn(), warn: vi.fn()}),
}));

const apiError = (statusCode: number, code = 'getUsers-ResponseError-001'): ThunderIDAPIError =>
  new ThunderIDAPIError('upstream said no', code, 'javascript', statusCode);

describe('loadPageWithRetryAndLog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    log.debug.mockClear();
    log.error.mockClear();
  });

  it('returns the result without logging when the call succeeds', async () => {
    const load = vi.fn().mockResolvedValue('page');

    await expect(loadPageWithRetryAndLog('users', {}, load)).resolves.toBe('page');
    expect(log.error).not.toHaveBeenCalled();
  });

  it('retries a server error once and logs nothing when the retry succeeds', async () => {
    const load = vi.fn().mockRejectedValueOnce(apiError(503)).mockResolvedValue('page');

    const pending = loadPageWithRetryAndLog('users', {}, load);
    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toBe('page');
    expect(load).toHaveBeenCalledTimes(2);
    expect(log.error).not.toHaveBeenCalled();
  });

  it('does not retry a client error, logs it once with its context and rethrows it unchanged', async () => {
    const failure: ThunderIDAPIError = apiError(403, 'getUsers-ForbiddenError-001');
    const load = vi.fn().mockRejectedValue(failure);

    await expect(loadPageWithRetryAndLog('auth flows', {limit: 20, offset: 40}, load)).rejects.toBe(failure);

    expect(load).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledTimes(1);
    const [message, details] = log.error.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBe('Failed to load auth flows.');
    expect(details).toMatchObject({
      attempts: 1,
      code: 'getUsers-ForbiddenError-001',
      limit: 20,
      offset: 40,
      status: 403,
    });
  });

  it('counts both attempts when the retry fails too', async () => {
    const load = vi.fn().mockRejectedValue(apiError(503));

    const pending = loadPageWithRetryAndLog('users', {}, load);
    await Promise.all([expect(pending).rejects.toBeDefined(), vi.advanceTimersByTimeAsync(500)]);

    expect(log.error.mock.calls[0][1]).toMatchObject({attempts: 2, status: 503});
  });

  it('logs every failure at error level by default', async () => {
    const load = vi.fn().mockRejectedValue(apiError(403));

    await expect(loadPageWithRetryAndLog('users', {}, load)).rejects.toBeDefined();
    await expect(loadPageWithRetryAndLog('users', {}, load)).rejects.toBeDefined();

    expect(log.error).toHaveBeenCalledTimes(2);
  });

  it('logs through the logger it is given instead', async () => {
    const logFailure = vi.fn();
    const failure: ThunderIDAPIError = apiError(404);

    await expect(
      loadPageWithRetryAndLog('users', {logFailure, offset: 5}, vi.fn().mockRejectedValue(failure)),
    ).rejects.toBe(failure);

    expect(logFailure).toHaveBeenCalledWith('users', failure, expect.objectContaining({attempts: 1, offset: 5}));
    expect(log.error).not.toHaveBeenCalled();
  });

  it('does not log a call that was aborted', async () => {
    const controller: AbortController = new AbortController();
    const load = vi.fn().mockImplementation(() => {
      controller.abort();

      return Promise.reject(apiError(0));
    });

    await expect(loadPageWithRetryAndLog('users', {signal: controller.signal}, load)).rejects.toBeDefined();

    expect(log.error).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('logs an error that is not an SDK error without a code or status', async () => {
    await expect(loadPageWithRetryAndLog('users', {}, vi.fn().mockRejectedValue('plain'))).rejects.toBe('plain');

    expect(log.error.mock.calls[0][1]).toMatchObject({code: 'unknown', status: undefined});
    expect(log.error.mock.calls[0][1]).not.toHaveProperty('message');
  });
});
