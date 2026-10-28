// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnit, UpdateOrganizationUnitByPathRequest} from '../../../models/organization-unit';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateOrganizationUnitByPath request.
 */
export interface UpdateOrganizationUnitByPathConfig extends ManagementRequestConfig {
  /**
   * Handle path of the organization unit, such as `engineering/platform`. Each handle is encoded and the
   * slashes between them are kept.
   */
  path: string;
  /**
   * The organization unit's new state.
   */
  payload: UpdateOrganizationUnitByPathRequest;
}

/**
 * Updates an organization unit addressed by its handle path.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the organization unit as the server stored it.
 *
 * @example
 * ```typescript
 * const organizationUnit = await updateOrganizationUnitByPath({
 *   baseUrl: 'https://localhost:8090',
 *   path: 'engineering/platform',
 *   payload: {handle: 'platform', name: 'Platform Engineering'},
 * });
 * ```
 */
const updateOrganizationUnitByPath = async ({
  path,
  payload,
  ...config
}: UpdateOrganizationUnitByPathConfig): Promise<OrganizationUnit> =>
  requestManagementResource<OrganizationUnit>(config, {
    body: payload,
    collection: 'organization-units',
    failureMessage: 'Failed to update organization unit',
    id: 'tree',
    method: 'PUT',
    operation: 'updateOrganizationUnitByPath',
    subPath: encodeHandlePath('updateOrganizationUnitByPath', path),
  });

export default updateOrganizationUnitByPath;
