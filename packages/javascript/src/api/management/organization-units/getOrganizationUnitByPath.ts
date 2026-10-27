// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnit} from '../../../models/organization-unit';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getOrganizationUnitByPath request.
 */
export interface GetOrganizationUnitByPathConfig extends ManagementRequestConfig {
  /**
   * Handle path of the organization unit, such as `engineering/platform`. Each handle is encoded and the
   * slashes between them are kept.
   */
  path: string;
}

/**
 * Retrieves an organization unit by its handle path.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the organization unit.
 *
 * @example
 * ```typescript
 * const organizationUnit = await getOrganizationUnitByPath({baseUrl: 'https://localhost:8090', path: 'engineering/platform'});
 * ```
 */
const getOrganizationUnitByPath = async ({
  path,
  ...config
}: GetOrganizationUnitByPathConfig): Promise<OrganizationUnit> =>
  requestManagementResource<OrganizationUnit>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to fetch organization unit',
    id: 'tree',
    method: 'GET',
    operation: 'getOrganizationUnitByPath',
    subPath: encodeHandlePath('getOrganizationUnitByPath', path),
  });

export default getOrganizationUnitByPath;
