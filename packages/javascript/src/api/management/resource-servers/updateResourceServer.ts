// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ResourceServer, UpdateResourceServerRequest} from '../../../models/resource-server';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateResourceServer request.
 */
export interface UpdateResourceServerConfig extends ManagementRequestConfig {
  /**
   * The resource server's new state.
   */
  payload: UpdateResourceServerRequest;
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Updates a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resource server as the server stored it.
 *
 * @example
 * ```typescript
 * const resourceServer = await updateResourceServer({
 *   baseUrl: 'https://localhost:8090',
 *   resourceServerId,
 *   payload: {name: 'Orders API', ouId},
 * });
 * ```
 */
const updateResourceServer = async ({
  payload,
  resourceServerId,
  ...config
}: UpdateResourceServerConfig): Promise<ResourceServer> =>
  requestManagementResource<ResourceServer>(config, {
    body: payload,
    collection: 'resource-servers',
    failureMessage: 'Failed to update resource server',
    id: resourceServerId,
    method: 'PUT',
    operation: 'updateResourceServer',
  });

export default updateResourceServer;
