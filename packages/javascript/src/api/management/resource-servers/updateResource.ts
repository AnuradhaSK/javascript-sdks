// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import {ManagedResource, UpdateResourceRequest} from '../../../models/resource-server';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the updateResource request.
 */
export interface UpdateResourceConfig extends ManagementRequestConfig {
  /**
   * The resource's new state.
   */
  payload: UpdateResourceRequest;
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
 * Updates a resource of a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the resource as the server stored it.
 *
 * @example
 * ```typescript
 * const resource = await updateResource({
 *   baseUrl: 'https://localhost:8090',
 *   resourceId,
 *   resourceServerId,
 *   payload: {name: 'Customer orders'},
 * });
 * ```
 */
const updateResource = async ({
  payload,
  resourceId,
  resourceServerId,
  ...config
}: UpdateResourceConfig): Promise<ManagedResource> =>
  requestManagementResource<ManagedResource>(config, {
    body: payload,
    collection: 'resource-servers',
    failureMessage: 'Failed to update resource',
    id: resourceServerId,
    method: 'PUT',
    operation: 'updateResource',
    subPath: `resources/${encodePathSegments('updateResource', [resourceId])}`,
  });

export default updateResource;
