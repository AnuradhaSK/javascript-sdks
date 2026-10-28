// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnitReference, OrganizationUnitRoleListResponse} from '../../../models/organization-unit';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnitRoles request.
 */
export type GetOrganizationUnitRolesConfig = ManagementRequestConfig &
  Pick<ApiFilteringParams, 'limit' | 'offset'> &
  OrganizationUnitReference;

/**
 * Retrieves a page of the roles in an organization unit, addressed by its identifier (`ouId`) or its handle
 * path (`path`).
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {roles} = await getOrganizationUnitRoles({baseUrl: 'https://localhost:8090', path: 'engineering/platform', limit: 20});
 * ```
 */
const getOrganizationUnitRoles = async ({
  limit,
  offset,
  ouId,
  path,
  ...config
}: GetOrganizationUnitRolesConfig): Promise<OrganizationUnitRoleListResponse> =>
  requestManagementResource<OrganizationUnitRoleListResponse>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to fetch organization unit roles',
    id: path === undefined ? (ouId ?? '') : 'tree',
    method: 'GET',
    operation: 'getOrganizationUnitRoles',
    query: {limit, offset},
    subPath: path === undefined ? 'roles' : `${encodeHandlePath('getOrganizationUnitRoles', path)}/roles`,
  });

export default getOrganizationUnitRoles;
