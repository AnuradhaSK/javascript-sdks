// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnitReference, OrganizationUnitUserListResponse} from '../../../models/organization-unit';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnitUsers request.
 */
export type GetOrganizationUnitUsersConfig = ManagementRequestConfig &
  Pick<ApiFilteringParams, 'limit' | 'offset'> &
  OrganizationUnitReference;

/**
 * Retrieves a page of the users in an organization unit, addressed by its identifier (`ouId`) or its handle
 * path (`path`). Each user carries its resolved `display` value.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {users} = await getOrganizationUnitUsers({baseUrl: 'https://localhost:8090', path: 'engineering/platform', limit: 20});
 * ```
 */
const getOrganizationUnitUsers = async ({
  limit,
  offset,
  ouId,
  path,
  ...config
}: GetOrganizationUnitUsersConfig): Promise<OrganizationUnitUserListResponse> =>
  requestManagementResource<OrganizationUnitUserListResponse>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to fetch organization unit users',
    id: path === undefined ? (ouId ?? '') : 'tree',
    method: 'GET',
    operation: 'getOrganizationUnitUsers',
    query: {include: 'display', limit, offset},
    subPath: path === undefined ? 'users' : `${encodeHandlePath('getOrganizationUnitUsers', path)}/users`,
  });

export default getOrganizationUnitUsers;
