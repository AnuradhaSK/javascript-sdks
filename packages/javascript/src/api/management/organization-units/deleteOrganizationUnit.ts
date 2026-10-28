// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteOrganizationUnit request.
 */
export interface DeleteOrganizationUnitConfig extends ManagementRequestConfig {
  /**
   * Identifier of the organization unit to delete.
   */
  ouId: string;
}

/**
 * Deletes an organization unit.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteOrganizationUnit({baseUrl: 'https://localhost:8090', ouId});
 * ```
 */
const deleteOrganizationUnit = async ({ouId, ...config}: DeleteOrganizationUnitConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to delete organization unit',
    id: ouId,
    method: 'DELETE',
    operation: 'deleteOrganizationUnit',
  });
};

export default deleteOrganizationUnit;
