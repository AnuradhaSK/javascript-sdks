// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../errors/ThunderIDAPIError';

/**
 * What a server sends to the browser when a select page could not be loaded.
 */
export interface SelectPageErrorResult {
  /**
   * Text for a developer. It is built from fixed words, the resource name and the status, and never contains the
   * text of the failure itself.
   */
  message: string;
  /**
   * The HTTP status of the failed call, when the loader threw a {@link ThunderIDAPIError}. `0` means no response
   * arrived. It lets the browser side tell a 403 from a 503.
   */
  statusCode?: number;
}

/**
 * Describes a failed select page load in a form that is safe to send to the browser.
 *
 * The text of a failure is whatever the management API, or a proxy in front of it, replied, so it can carry data the
 * SDK does not control. It is logged on the server where the call is made, and it is not copied into this result. Only
 * the status of an API error is carried over.
 *
 * @param error - The value thrown by the page loader.
 * @param resource - What was being loaded, in plain words such as `users`. It names the resource in the message.
 * @returns The message and, for an API error, the status.
 * @example
 * ```typescript
 * mapSelectPageError(new ThunderIDAPIError('...', 'getUsers-ForbiddenError-001', 'node', 403), 'users');
 * // {message: 'Failed to load users (HTTP 403).', statusCode: 403}
 * ```
 *
 * @internal Shared by the SDK packages. It is not part of the public API and can change in any release.
 */
const mapSelectPageError = (error: unknown, resource = 'options'): SelectPageErrorResult => {
  const statusCode: number | undefined = error instanceof ThunderIDAPIError ? error.statusCode : undefined;

  return {
    message: `Failed to load ${resource}${statusCode ? ` (HTTP ${statusCode})` : ''}.`,
    ...(statusCode === undefined ? {} : {statusCode}),
  };
};

export default mapSelectPageError;
