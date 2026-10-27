// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CreateResourceServerRequest, ResourceServer} from '../../../models/resource-server';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createResourceServer request.
 */
export interface CreateResourceServerConfig extends ManagementRequestConfig {
  /**
   * The resource server to create.
   */
  payload: CreateResourceServerRequest;
}

/**
 * Creates a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resource server as the server stored it.
 *
 * @example
 * ```typescript
 * const resourceServer = await createResourceServer({
 *   baseUrl: 'https://localhost:8090',
 *   payload: {identifier: 'https://api.example.com', name: 'Orders API', ouId},
 * });
 * ```
 */
const createResourceServer = async ({payload, ...config}: CreateResourceServerConfig): Promise<ResourceServer> =>
  requestManagementResource<ResourceServer>(config, {
    body: payload,
    collection: 'resource-servers',
    failureMessage: 'Failed to create resource server',
    method: 'POST',
    operation: 'createResourceServer',
  });

export default createResourceServer;
