// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnitListResponse} from '../../../models/organization-unit';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnits request.
 */
export type GetOrganizationUnitsConfig = ManagementRequestConfig & ApiFilteringParams;

/**
 * Retrieves a page of the root organization units.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {organizationUnits} = await getOrganizationUnits({baseUrl: 'https://localhost:8090', filter: 'handle sw "eng"'});
 * ```
 */
const getOrganizationUnits = async ({
  filter,
  limit,
  offset,
  ...config
}: GetOrganizationUnitsConfig): Promise<OrganizationUnitListResponse> =>
  requestManagementResource<OrganizationUnitListResponse>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to fetch organization units',
    method: 'GET',
    operation: 'getOrganizationUnits',
    query: {filter, limit, offset},
  });

export default getOrganizationUnits;
