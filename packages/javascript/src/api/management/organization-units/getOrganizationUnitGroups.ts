// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnitGroupListResponse, OrganizationUnitReference} from '../../../models/organization-unit';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnitGroups request.
 */
export type GetOrganizationUnitGroupsConfig = ManagementRequestConfig &
  Pick<ApiFilteringParams, 'limit' | 'offset'> &
  OrganizationUnitReference;

/**
 * Retrieves a page of the groups in an organization unit, addressed by its identifier (`ouId`) or its
 * handle path (`path`).
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {groups} = await getOrganizationUnitGroups({baseUrl: 'https://localhost:8090', path: 'engineering/platform', limit: 20});
 * ```
 */
const getOrganizationUnitGroups = async ({
  limit,
  offset,
  ouId,
  path,
  ...config
}: GetOrganizationUnitGroupsConfig): Promise<OrganizationUnitGroupListResponse> =>
  requestManagementResource<OrganizationUnitGroupListResponse>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to fetch organization unit groups',
    id: path === undefined ? (ouId ?? '') : 'tree',
    method: 'GET',
    operation: 'getOrganizationUnitGroups',
    query: {limit, offset},
    subPath: path === undefined ? 'groups' : `${encodeHandlePath('getOrganizationUnitGroups', path)}/groups`,
  });

export default getOrganizationUnitGroups;
