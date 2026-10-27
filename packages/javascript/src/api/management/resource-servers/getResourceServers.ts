// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ResourceServerListResponse} from '../../../models/resource-server';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getResourceServers request.
 */
export type GetResourceServersConfig = ManagementRequestConfig & Pick<ApiFilteringParams, 'limit' | 'offset'>;

/**
 * Retrieves a page of resource servers.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {resourceServers} = await getResourceServers({baseUrl: 'https://localhost:8090', limit: 20});
 * ```
 */
const getResourceServers = async ({
  limit,
  offset,
  ...config
}: GetResourceServersConfig): Promise<ResourceServerListResponse> =>
  requestManagementResource<ResourceServerListResponse>(config, {
    collection: 'resource-servers',
    failureMessage: 'Failed to fetch resource servers',
    method: 'GET',
    operation: 'getResourceServers',
    query: {limit, offset},
  });

export default getResourceServers;
