// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import isRetryableError from './isRetryableError';

const DEFAULT_RETRY_DELAY_MS = 500;

export interface RetryOptions {
  /** Pause before the single retry. Defaults to 500 ms. */
  delayMs?: number;
  /** Decides whether a failure is retried. Defaults to {@link isRetryableError}. */
  shouldRetry?: (error: unknown) => boolean;
  /** Aborting cancels the pause and skips the retry. */
  signal?: AbortSignal;
}

const pause = (delayMs: number, signal?: AbortSignal): Promise<void> =>
  new Promise<void>((resolve: () => void) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    signal?.addEventListener('abort', onAbort, {once: true});
  });

/**
 * Runs a read operation and, when it fails with a retryable error, runs it once more after a short
 * pause. Only use it for operations that are safe to repeat.
 */
const withRetry = async <T>(
  operation: () => Promise<T>,
  {delayMs = DEFAULT_RETRY_DELAY_MS, shouldRetry = isRetryableError, signal}: RetryOptions = {},
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (signal?.aborted || !shouldRetry(error)) {
      throw error;
    }

    await pause(delayMs, signal);

    if (signal?.aborted) {
      throw error;
    }

    return operation();
  }
};

export default withRetry;
