// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnit} from '../../../models/organization-unit';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnit request.
 */
export interface GetOrganizationUnitConfig extends ManagementRequestConfig {
  /**
   * Identifier of the organization unit.
   */
  ouId: string;
}

/**
 * Retrieves an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the organization unit.
 *
 * @example
 * ```typescript
 * const organizationUnit = await getOrganizationUnit({baseUrl: 'https://localhost:8090', ouId});
 * ```
 */
const getOrganizationUnit = async ({ouId, ...config}: GetOrganizationUnitConfig): Promise<OrganizationUnit> =>
  requestManagementResource<OrganizationUnit>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to fetch organization unit',
    id: ouId,
    method: 'GET',
    operation: 'getOrganizationUnit',
  });

export default getOrganizationUnit;
