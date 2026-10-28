// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {DesignLayoutListResponse} from '../../../models/design';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getLayouts request.
 */
export type GetLayoutsConfig = ManagementRequestConfig & Pick<ApiFilteringParams, 'limit' | 'offset'>;

/**
 * Retrieves a page of layouts.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the page the server returned.
 *
 * @example
 * ```typescript
 * const {layouts} = await getLayouts({baseUrl: 'https://localhost:8090', limit: 20});
 * ```
 */
const getLayouts = async ({limit, offset, ...config}: GetLayoutsConfig): Promise<DesignLayoutListResponse> =>
  requestManagementResource<DesignLayoutListResponse>(config, {
    collection: 'design',
    failureMessage: 'Failed to fetch layouts',
    id: 'layouts',
    method: 'GET',
    operation: 'getLayouts',
    query: {limit, offset},
  });

export default getLayouts;
