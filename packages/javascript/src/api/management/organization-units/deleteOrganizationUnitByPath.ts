// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodeHandlePath from '../../../utils/encodeHandlePath';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteOrganizationUnitByPath request.
 */
export interface DeleteOrganizationUnitByPathConfig extends ManagementRequestConfig {
  /**
   * Handle path of the organization unit, such as `engineering/platform`. Each handle is encoded and the
   * slashes between them are kept.
   */
  path: string;
}

/**
 * Deletes an organization unit addressed by its handle path.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteOrganizationUnitByPath({baseUrl: 'https://localhost:8090', path: 'engineering/platform'});
 * ```
 */
const deleteOrganizationUnitByPath = async ({path, ...config}: DeleteOrganizationUnitByPathConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'organization-units',
    failureMessage: 'Failed to delete organization unit',
    id: 'tree',
    method: 'DELETE',
    operation: 'deleteOrganizationUnitByPath',
    subPath: encodeHandlePath('deleteOrganizationUnitByPath', path),
  });
};

export default deleteOrganizationUnitByPath;
