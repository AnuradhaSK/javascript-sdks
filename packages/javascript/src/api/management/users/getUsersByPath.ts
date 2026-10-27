// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ManagedUserListResponse} from '../../../models/managed-user';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getUsersByPath request.
 */
export interface GetUsersByPathConfig extends ManagementRequestConfig, Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Handle path of the organization unit, such as `engineering/platform`. Each handle is encoded and the
   * slashes between them are kept.
   */
  path: string;
}

/**
 * Retrieves a page of the users in the organization unit at a handle path. Each user carries its resolved
 * `display` value.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {users} = await getUsersByPath({baseUrl: 'https://localhost:8090', path: 'engineering/platform', limit: 20});
 * ```
 */
const getUsersByPath = async ({
  limit,
  offset,
  path,
  ...config
}: GetUsersByPathConfig): Promise<ManagedUserListResponse> =>
  requestManagementResource<ManagedUserListResponse>(config, {
    collection: 'users',
    failureMessage: 'Failed to fetch users',
    id: 'tree',
    method: 'GET',
    operation: 'getUsersByPath',
    query: {include: 'display', limit, offset},
    subPath: encodeHandlePath('getUsersByPath', path),
  });

export default getUsersByPath;
