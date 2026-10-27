// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ManagementRequestConfig} from '../../../models/api';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the deleteResource request.
 */
export interface DeleteResourceConfig extends ManagementRequestConfig {
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
 * Deletes a resource of a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves once the server has made the change.
 *
 * @example
 * ```typescript
 * await deleteResource({baseUrl: 'https://localhost:8090', resourceId, resourceServerId});
 * ```
 */
const deleteResource = async ({resourceId, resourceServerId, ...config}: DeleteResourceConfig): Promise<void> => {
  await requestManagementResource<void>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to delete resource',
    id: resourceServerId,
    method: 'DELETE',
    operation: 'deleteResource',
    subPath: `resources/${encodePathSegments('deleteResource', [resourceId])}`,
  });
};

export default deleteResource;
