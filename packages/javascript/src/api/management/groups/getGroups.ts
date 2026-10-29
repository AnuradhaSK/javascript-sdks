// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {GroupListResponse} from '../../../models/group';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getGroups request.
 */
export type GetGroupsConfig = ManagementRequestConfig & Pick<ApiFilteringParams, 'filter' | 'limit' | 'offset'>;

/**
 * Retrieves a page of groups.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {groups} = await getGroups({
 *   baseUrl: 'https://localhost:8090',
 *   filter: 'ouId eq "c4f2a5e0-0a54-4b8e-9d1a-2f6c1e7b8a90"',
 *   limit: 20,
 * });
 * ```
 */
const getGroups = async ({filter, limit, offset, ...config}: GetGroupsConfig): Promise<GroupListResponse> =>
  requestManagementResource<GroupListResponse>(config, {
    collection: 'groups',
    failureMessage: 'Failed to fetch groups',
    method: 'GET',
    operation: 'getGroups',
    query: {filter, include: 'display', limit, offset},
  });

export default getGroups;
