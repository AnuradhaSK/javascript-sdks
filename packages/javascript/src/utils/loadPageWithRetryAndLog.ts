// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {logResourceFailure, type ResourceFailureLogger} from './logResourceFailure';
import withRetry from './withRetry';

export interface PageLoadOptions {
  limit?: number;
  /** Where a failure is logged. Defaults to one error line per failure. */
  logFailure?: ResourceFailureLogger;
  offset?: number;
  /** Aborting cancels the retry pause and keeps an abort from being logged as a failure. */
  signal?: AbortSignal;
}

/**
 * Runs one page request of a resource list. A server error or a failure with no response is retried once, a client
 * error is not. The final failure is logged once, with the call context, and rethrown unchanged. Use it where the
 * API call is made and the real error and its status are still known.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const loadPageWithRetryAndLog = async <T>(
  resource: string,
  {limit, logFailure = logResourceFailure, offset, signal}: PageLoadOptions,
  load: () => Promise<T>,
): Promise<T> => {
  const startedAt: number = performance.now();
  let attempts = 0;

  try {
    return await withRetry(
      () => {
        attempts += 1;

        return load();
      },
      {signal},
    );
  } catch (error) {
    if (!signal?.aborted) {
      logFailure(resource, error, {attempts, limit, offset, startedAt});
    }

    throw error;
  }
};

export default loadPageWithRetryAndLog;
