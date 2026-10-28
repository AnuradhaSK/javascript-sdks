// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ManagedResourceListResponse} from '../../../models/resource-server';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getResources request.
 */
export interface GetResourcesConfig extends ManagementRequestConfig, Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Lists the resources nested under this resource instead of the top-level ones.
   */
  parentId?: string;
  /**
   * Identifier of the resource server.
   */
  resourceServerId: string;
}

/**
 * Retrieves a page of the resources of a resource server.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {resources} = await getResources({baseUrl: 'https://localhost:8090', resourceServerId});
 * ```
 */
const getResources = async ({
  limit,
  offset,
  parentId,
  resourceServerId,
  ...config
}: GetResourcesConfig): Promise<ManagedResourceListResponse> =>
  requestManagementResource<ManagedResourceListResponse>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to fetch resources',
    id: resourceServerId,
    method: 'GET',
    operation: 'getResources',
    query: {limit, offset, parentId},
    subPath: 'resources',
  });

export default getResources;
