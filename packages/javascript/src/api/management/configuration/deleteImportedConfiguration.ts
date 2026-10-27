// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {DeleteImportedConfigurationRequest, DeleteImportedConfigurationResponse} from '../../../models/configuration';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteImportedConfiguration request.
 */
export interface DeleteImportedConfigurationConfig extends ManagementRequestConfig {
  /**
   * The resource whose file to delete.
   */
  payload: DeleteImportedConfigurationRequest;
}

/**
 * Deletes an imported declarative resource file.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the deleted file.
 *
 * @example
 * ```typescript
 * const {deletedFile} = await deleteImportedConfiguration({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {resourceKey: 'my-app', resourceType: 'application'},
 * });
 * ```
 */
const deleteImportedConfiguration = async ({
  payload,
  ...config
}: DeleteImportedConfigurationConfig): Promise<DeleteImportedConfigurationResponse> =>
  requestManagementResource<DeleteImportedConfigurationResponse>(config, {
    body: payload,
    collection: 'import',
    failureMessage: 'Failed to delete imported configuration',
    id: 'delete',
    method: 'POST',
    operation: 'deleteImportedConfiguration',
  });

export default deleteImportedConfiguration;
