// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteVariable request.
 */
export interface DeleteVariableConfig extends ManagementRequestConfig {
  /**
   * Name of the variable.
   */
  name: string;
}

/**
 * Deletes a variable.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteVariable({baseUrl: 'https://localhost:8090', name: 'SMTP_HOST'});
 * ```
 */
const deleteVariable = async ({name, ...config}: DeleteVariableConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'variables',
    failureMessage: 'Failed to delete variable',
    id: name,
    method: 'DELETE',
    operation: 'deleteVariable',
  });
};

export default deleteVariable;
