// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteResourceServer request.
 */
export interface DeleteResourceServerConfig extends ManagementRequestConfig {
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Deletes a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteResourceServer({baseUrl: 'https://localhost:8090', resourceServerId});
 * ```
 */
const deleteResourceServer = async ({resourceServerId, ...config}: DeleteResourceServerConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to delete resource server',
    id: resourceServerId,
    method: 'DELETE',
    operation: 'deleteResourceServer',
  });
};

export default deleteResourceServer;
