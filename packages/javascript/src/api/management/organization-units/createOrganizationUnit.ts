// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CreateOrganizationUnitRequest, OrganizationUnit} from '../../../models/organization-unit';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createOrganizationUnit request.
 */
export interface CreateOrganizationUnitConfig extends ManagementRequestConfig {
  /**
   * The organization unit to create. `parent` is `null` for a root.
   */
  payload: CreateOrganizationUnitRequest;
}

/**
 * Creates an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the organization unit as the server stored it.
 *
 * @example
 * ```typescript
 * const organizationUnit = await createOrganizationUnit({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {handle: 'platform', name: 'Platform', parent: engineeringId},
 * });
 * ```
 */
const createOrganizationUnit = async ({payload, ...config}: CreateOrganizationUnitConfig): Promise<OrganizationUnit> =>
  requestManagementResource<OrganizationUnit>(config, {
    body: payload,
    collection: 'organization-units',
    failureMessage: 'Failed to create organization unit',
    method: 'POST',
    operation: 'createOrganizationUnit',
  });

export default createOrganizationUnit;
