// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {OrganizationUnit, UpdateOrganizationUnitRequest} from '../../../models/organization-unit';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateOrganizationUnit request.
 */
export interface UpdateOrganizationUnitConfig extends ManagementRequestConfig {
  /**
   * Identifier of the organization unit.
   */
  ouId: string;
  /**
   * The organization unit's new state.
   */
  payload: UpdateOrganizationUnitRequest;
}

/**
 * Updates an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the organization unit as the server stored it.
 *
 * @example
 * ```typescript
 * const organizationUnit = await updateOrganizationUnit({
 *   baseUrl: 'https://localhost:8090',
 *   ouId,
 *   payload: {handle: 'platform', name: 'Platform Engineering', parent: engineeringId},
 * });
 * ```
 */
const updateOrganizationUnit = async ({
  ouId,
  payload,
  ...config
}: UpdateOrganizationUnitConfig): Promise<OrganizationUnit> =>
  requestManagementResource<OrganizationUnit>(config, {
    body: payload,
    collection: 'organization-units',
    failureMessage: 'Failed to update organization unit',
    id: ouId,
    method: 'PUT',
    operation: 'updateOrganizationUnit',
  });

export default updateOrganizationUnit;
