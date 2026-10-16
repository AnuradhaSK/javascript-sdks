// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {createPackageComponentLogger} from './logger';
import ThunderIDAPIError from '../errors/ThunderIDAPIError';
import ThunderIDError from '../errors/ThunderIDError';

const logger: ReturnType<typeof createPackageComponentLogger> = createPackageComponentLogger(
  '@thunderid/javascript',
  'logResourceFailure',
);

export interface ResourceFailureDetails {
  attempts: number;
  limit?: number;
  offset?: number;
  /** `performance.now()` when the call started. */
  startedAt: number;
}

export type ResourceFailureLogger = (resource: string, error: unknown, details: ResourceFailureDetails) => void;

const describeFailure = (error: unknown, {attempts, limit, offset, startedAt}: ResourceFailureDetails) => ({
  attempts,
  code: error instanceof ThunderIDError ? error.code : 'unknown',
  durationMs: Math.round(performance.now() - startedAt),
  limit,
  offset,
  status: error instanceof ThunderIDAPIError ? error.statusCode : undefined,
});

/**
 * Logs one error line for a failed resource load: which call, the offset and limit, the status or SDK error code,
 * the number of attempts and how long it ran. It names those fields only. The text of the failure is left out on
 * purpose, because it is whatever the server or a proxy replied and can carry data the SDK does not control. The
 * caller still gets the full error through `onError`.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
export const logResourceFailure: ResourceFailureLogger = (resource, error, details): void => {
  logger.error(`Failed to load ${resource}.`, describeFailure(error, details));
};

/**
 * A failure logger for one long-lived list: the first failure of each error code is logged as an error and repeats
 * at debug level, so repeated attempts against a failing list do not flood the log.
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
export const createResourceFailureLogger = (): ResourceFailureLogger => {
  const loggedCodes = new Set<string>();

  return (resource, error, details): void => {
    const code: string = error instanceof ThunderIDError ? error.code : 'unknown';

    if (loggedCodes.has(code)) {
      logger.debug(`Failed to load ${resource} again.`, describeFailure(error, details));

      return;
    }

    loggedCodes.add(code);
    logResourceFailure(resource, error, details);
  };
};
