// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ResourceServer} from '../../../models/resource-server';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getResourceServer request.
 */
export interface GetResourceServerConfig extends ManagementRequestConfig {
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Retrieves a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resource server.
 *
 * @example
 * ```typescript
 * const resourceServer = await getResourceServer({baseUrl: 'https://localhost:8090', resourceServerId});
 * ```
 */
const getResourceServer = async ({resourceServerId, ...config}: GetResourceServerConfig): Promise<ResourceServer> =>
  requestManagementResource<ResourceServer>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to fetch resource server',
    id: resourceServerId,
    method: 'GET',
    operation: 'getResourceServer',
  });

export default getResourceServer;
