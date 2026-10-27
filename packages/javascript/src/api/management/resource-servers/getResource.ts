// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedResource} from '../../../models/resource-server';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getResource request.
 */
export interface GetResourceConfig extends ManagementRequestConfig {
  /**
   * Identifier of the resource.
   */
  resourceId: string;
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Retrieves a resource of a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resource.
 *
 * @example
 * ```typescript
 * const resource = await getResource({baseUrl: 'https://localhost:8090', resourceId, resourceServerId});
 * ```
 */
const getResource = async ({resourceId, resourceServerId, ...config}: GetResourceConfig): Promise<ManagedResource> =>
  requestManagementResource<ManagedResource>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to fetch resource',
    id: resourceServerId,
    method: 'GET',
    operation: 'getResource',
    subPath: `resources/${encodePathSegments('getResource', [resourceId])}`,
  });

export default getResource;
