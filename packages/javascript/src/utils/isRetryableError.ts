// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../errors/ThunderIDAPIError';

/**
 * Tells whether a failed read is worth trying once more: a server error (5xx) or no response at all
 * (status 0, as reported for network failures and timeouts). Client errors (4xx) are final.
 */
const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof ThunderIDAPIError) || error.statusCode === undefined) {
    return false;
  }

  return error.statusCode === 0 || error.statusCode >= 500;
};

export default isRetryableError;
