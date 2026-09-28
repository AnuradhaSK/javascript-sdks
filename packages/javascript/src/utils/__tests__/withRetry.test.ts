// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import withRetry from '../withRetry';

const apiError = (statusCode: number): ThunderIDAPIError =>
  new ThunderIDAPIError('failed', 'getUsers-ResponseError-001', 'javascript', statusCode);

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result without retrying when the first attempt succeeds', async () => {
    const operation = vi.fn().mockResolvedValue('ok');

    await expect(withRetry(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries once after the default pause when the failure is retryable', async () => {
    const operation = vi.fn().mockRejectedValueOnce(apiError(503)).mockResolvedValue('ok');

    const result: Promise<string> = withRetry(operation);
    await vi.advanceTimersByTimeAsync(499);
    expect(operation).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('retries only once and throws the second failure', async () => {
    const secondFailure: ThunderIDAPIError = apiError(502);
    const operation = vi.fn().mockRejectedValueOnce(apiError(503)).mockRejectedValueOnce(secondFailure);

    const result: Promise<unknown> = withRetry(operation);

    await Promise.all([expect(result).rejects.toBe(secondFailure), vi.advanceTimersByTimeAsync(500)]);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry a client error', async () => {
    const failure: ThunderIDAPIError = apiError(403);
    const operation = vi.fn().mockRejectedValue(failure);

    await expect(withRetry(operation)).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('uses the given delay and retry decision', async () => {
    const operation = vi.fn().mockRejectedValueOnce(new Error('flaky')).mockResolvedValue('ok');

    const result: Promise<string> = withRetry(operation, {delayMs: 50, shouldRetry: () => true});
    await vi.advanceTimersByTimeAsync(50);

    await expect(result).resolves.toBe('ok');
  });

  it('skips the retry when the signal is already aborted', async () => {
    const failure: ThunderIDAPIError = apiError(503);
    const operation = vi.fn().mockRejectedValue(failure);
    const controller: AbortController = new AbortController();
    controller.abort();

    await expect(withRetry(operation, {signal: controller.signal})).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('cancels the pause and skips the retry when aborted while waiting', async () => {
    const failure: ThunderIDAPIError = apiError(503);
    const operation = vi.fn().mockRejectedValue(failure);
    const controller: AbortController = new AbortController();

    const result: Promise<unknown> = withRetry(operation, {signal: controller.signal});

    await Promise.all([
      expect(result).rejects.toBe(failure),
      vi.advanceTimersByTimeAsync(100).then(() => controller.abort()),
    ]);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
