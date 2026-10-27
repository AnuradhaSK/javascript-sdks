// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ApiFilteringParams, ManagementRequestConfig} from '../../../models/api';
import {ResourceUsagesResponse} from '../../../models/resource-usage';
import encodePathSegments from '../../../utils/encodePathSegments';
import requestManagementResource from '../../../utils/requestManagementResource';

/**
 * Configuration for the getLayoutUsages request.
 */
export interface GetLayoutUsagesConfig extends ManagementRequestConfig, Pick<ApiFilteringParams, 'limit' | 'offset'> {
  /**
   * Identifier of the layout.
   */
  layoutId: string;
}

/**
 * Retrieves a page of the applications and agents that use a layout.
 *
 * @param config - Request configuration object.
 * @returns A promise that resolves with the usages.
 *
 * @example
 * ```typescript
 * const {usages} = await getLayoutUsages({baseUrl: 'https://localhost:8090', layoutId});
 * ```
 */
const getLayoutUsages = async ({
  layoutId,
  limit,
  offset,
  ...config
}: GetLayoutUsagesConfig): Promise<ResourceUsagesResponse> =>
  requestManagementResource<ResourceUsagesResponse>(config, {
    collection: 'design',
    failureMessage: 'Failed to fetch layout usages',
    id: 'layouts',
    method: 'GET',
    operation: 'getLayoutUsages',
    query: {limit, offset},
    subPath: `${encodePathSegments('getLayoutUsages', [layoutId])}/usages`,
  });

export default getLayoutUsages;
