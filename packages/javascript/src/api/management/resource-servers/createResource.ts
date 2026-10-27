// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {CreateResourceRequest, ManagedResource} from '../../../models/resource-server';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the createResource request.
 */
export interface CreateResourceConfig extends ManagementRequestConfig {
  /**
   * The resource to create.
   */
  payload: CreateResourceRequest;
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Creates a resource on a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resource as the server stored it.
 *
 * @example
 * ```typescript
 * const resource = await createResource({
 *   baseUrl: 'https://localhost:8090',
 *   resourceServerId,
 *   payload: {handle: 'orders', name: 'Orders'},
 * });
 * ```
 */
const createResource = async ({payload, resourceServerId, ...config}: CreateResourceConfig): Promise<ManagedResource> =>
  requestManagementResource<ManagedResource>(config, {
    body: payload,
    collection: 'resource-servers',
    failureMessage: 'Failed to create resource',
    id: resourceServerId,
    method: 'POST',
    operation: 'createResource',
    subPath: 'resources',
  });

export default createResource;
